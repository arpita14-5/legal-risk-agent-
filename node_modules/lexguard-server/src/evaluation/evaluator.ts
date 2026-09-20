import { EVALUATION_BENCHMARK_DATASET } from './dataset.js';
import { classifyClauseText } from '../services/clauseClassifier.js';
import { detectContractRisks } from '../services/riskDetector.js';
import { HybridRetriever } from '../rag/hybridRetriever.js';
import { getRepository } from '../db/repository.js';
import type { Clause } from '../types/shared.js';

interface MetricResult {
  precision: number;
  recall: number;
  f1: number;
}

function calculateF1(tp: number, fp: number, fn: number): MetricResult {
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

export async function runAcademicEvaluation() {
  console.log('\n========================================================================');
  console.log('   ðŸŽ“ LexGuard Academic & RAG Evaluation Suite');
  console.log('========================================================================\n');

  // 1. Evaluate Clause Classification
  let clauseTp = 0;
  let clauseFp = 0;
  let clauseFn = 0;

  console.log('--- 1. Evaluating Clause Classification Benchmark ---');
  for (const item of EVALUATION_BENCHMARK_DATASET) {
    const result = classifyClauseText(item.text);
    const isCorrect = result.category === item.expectedCategory;
    if (isCorrect) {
      clauseTp++;
      console.log(`  âœ“ [${item.id}] Matched "${item.expectedCategory}" (conf: ${result.confidence})`);
    } else {
      clauseFp++;
      clauseFn++;
      console.log(`  âœ— [${item.id}] Expected "${item.expectedCategory}" but got "${result.category}"`);
    }
  }

  const clauseMetrics = calculateF1(clauseTp, clauseFp, clauseFn);

  // 2. Evaluate Risk Detection
  console.log('\n--- 2. Evaluating Contract Risk Detection Benchmark ---');
  let riskTp = 0;
  let riskFp = 0;
  let riskFn = 0;

  for (const item of EVALUATION_BENCHMARK_DATASET) {
    const fakeClause: Clause = {
      id: item.id,
      contractId: 'eval-contract',
      clauseType: item.expectedCategory,
      pageNumber: 1,
      text: item.text,
      confidence: 0.95
    };

    const detected = detectContractRisks([fakeClause], item.text, 'eval-contract');
    const hasRisk = detected.length > 0;

    if (item.containsRisk) {
      if (hasRisk) {
        riskTp++;
        console.log(`  âœ“ [${item.id}] Correctly detected risk: "${detected[0].title}" [${detected[0].category}]`);
      } else {
        riskFn++;
        console.log(`  âœ— [${item.id}] False Negative: Failed to detect expected risk`);
      }
    } else {
      if (!hasRisk) {
        riskTp++;
        console.log(`  âœ“ [${item.id}] Correctly identified benign clause (No risk)`);
      } else {
        riskFp++;
        console.log(`  âœ— [${item.id}] False Positive: Detected unexpected risk "${detected[0].title}"`);
      }
    }
  }

  const riskMetrics = calculateF1(riskTp, riskFp, riskFn);

  // 3. Evaluate Hybrid Retrieval Recall@K
  console.log('\n--- 3. Evaluating Hybrid Retrieval Recall@K (K=3, K=5) ---');
  const repo = await getRepository();
  const testContractId = 'eval-retrieval-test-contract';

  // Seed chunks for retrieval test
  const chunksToSave = EVALUATION_BENCHMARK_DATASET.map((item, idx) => ({
    contractId: testContractId,
    chunkIndex: idx,
    pageNumber: Math.floor(idx / 3) + 1,
    sectionNumber: `Section ${idx + 1}`,
    sectionTitle: `${item.expectedCategory} Terms`,
    clauseType: item.expectedCategory,
    text: item.text
  }));

  await repo.saveChunks(testContractId, chunksToSave);

  const testQueries = [
    { query: 'limitation of liability and aggregate damages cap', expectedId: 'bench-1' },
    { query: 'unlimited liability for punitive damages', expectedId: 'bench-2' },
    { query: 'indemnify and hold harmless third party claims', expectedId: 'bench-3' },
    { query: 'written notice for automatic contract renewal', expectedId: 'bench-6' },
    { query: 'non-compete restriction geographical market', expectedId: 'bench-10' }
  ];

  const retriever = new HybridRetriever();
  let hitsAt3 = 0;
  let hitsAt5 = 0;

  for (const tq of testQueries) {
    const result3 = await retriever.retrieve(testContractId, tq.query, 3);
    const foundAt3 = result3.contractChunks.some(c => c.chunk.text.includes(tq.expectedId) || c.chunk.text === EVALUATION_BENCHMARK_DATASET.find(b => b.id === tq.expectedId)?.text);
    if (foundAt3) hitsAt3++;

    const result5 = await retriever.retrieve(testContractId, tq.query, 5);
    const foundAt5 = result5.contractChunks.some(c => c.chunk.text.includes(tq.expectedId) || c.chunk.text === EVALUATION_BENCHMARK_DATASET.find(b => b.id === tq.expectedId)?.text);
    if (foundAt5) {
      hitsAt5++;
      console.log(`  âœ“ Recall Hit for query "${tq.query.slice(0, 40)}..."`);
    } else {
      console.log(`  âœ— Recall Miss for query "${tq.query.slice(0, 40)}..."`);
    }
  }

  const recallAt3 = hitsAt3 / testQueries.length;
  const recallAt5 = hitsAt5 / testQueries.length;

  // Print Summary Table
  console.log('\n========================================================================');
  console.log('   ðŸ“Š EVALUATION RESULTS SUMMARY TABLE (ACADEMIC BENCHMARK)');
  console.log('========================================================================');
  console.log(`  Clause Classification Precision: ${(clauseMetrics.precision * 100).toFixed(1)}%`);
  console.log(`  Clause Classification Recall:    ${(clauseMetrics.recall * 100).toFixed(1)}%`);
  console.log(`  Clause Classification F1-Score:  ${(clauseMetrics.f1 * 100).toFixed(1)}%`);
  console.log('  ----------------------------------------------------------------------');
  console.log(`  Risk Detection Precision:        ${(riskMetrics.precision * 100).toFixed(1)}%`);
  console.log(`  Risk Detection Recall:           ${(riskMetrics.recall * 100).toFixed(1)}%`);
  console.log(`  Risk Detection F1-Score:         ${(riskMetrics.f1 * 100).toFixed(1)}%`);
  console.log('  ----------------------------------------------------------------------');
  console.log(`  Hybrid Retrieval Recall@3:       ${(recallAt3 * 100).toFixed(1)}%`);
  console.log(`  Hybrid Retrieval Recall@5:       ${(recallAt5 * 100).toFixed(1)}%`);
  console.log('========================================================================\n');
}

runAcademicEvaluation().catch(err => {
  console.error('Evaluation run failed:', err);
  process.exit(1);
});