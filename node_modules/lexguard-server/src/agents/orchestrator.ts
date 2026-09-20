import { ContractAgent } from './contractAgent.js';
import { RiskAgent } from './riskAgent.js';
import { ResearchAgent } from './researchAgent.js';
import { ComparisonAgent } from './comparisonAgent.js';
import { VerificationAgent } from './verificationAgent.js';
import { HybridRetriever } from '../rag/hybridRetriever.js';
import { getLLMProvider } from '../ai/providerFactory.js';
import { getRepository } from '../db/repository.js';
import { config } from '../config/env.js';
import {
  extractContractMetadata,
  extractContractTimeline,
  extractContractObligations,
  generateExecutiveSummaryData
} from '../services/metadataExtractor.js';
import type {
  ContractDocument,
  Clause,
  ContractAnalysis,
  ChatMessage,
  ComparisonResult
} from '../types/shared.js';

export class AgentOrchestrator {
  private contractAgent = new ContractAgent();
  private riskAgent = new RiskAgent();
  private researchAgent = new ResearchAgent();
  private comparisonAgent = new ComparisonAgent();
  private verificationAgent = new VerificationAgent();
  private retriever = new HybridRetriever();

  /**
   * Complete Multi-Agent Contract Analysis Flow
   */
  async runFullAnalysis(contractId: string, fullText: string, initialClauses: Clause[]): Promise<ContractAnalysis> {
    const repo = await getRepository();
    const startTime = Date.now();

    // 1. Contract Agent: extract obligations and executive summary
    const contractDoc = await repo.getContractById(contractId);
    if (!contractDoc) throw new Error(`Contract ${contractId} not found`);

    const existingClauses = await repo.getClausesByContractId(contractId);
    const clauses = existingClauses.length > 0 ? existingClauses : initialClauses;

    // 2. Risk Agent: detect contractual risks & score
    const riskAnalysis = await this.riskAgent.evaluateContractRisks(clauses, fullText, contractId);

    // 3. Research Agent: find authoritative legal precedents
    const riskCategories = Array.from(new Set(riskAnalysis.risks.map(r => r.category)));
    const legalAuthorities = await this.researchAgent.findRelevantLegalAuthorities(riskCategories);

    // Attach legal citations to corresponding risks
    for (const r of riskAnalysis.risks) {
      const matched = legalAuthorities.filter(la => la.title.toLowerCase().includes(r.category.toLowerCase()) || r.title.toLowerCase().includes(la.title.toLowerCase()));
      if (matched.length > 0) {
        r.legalSources = matched;
      }
    }

    // 4. Contract Agent & Metadata Extraction
    const metadata = extractContractMetadata(fullText);
    const obligationsList = extractContractObligations(fullText, clauses, metadata);
    const timelineEvents = extractContractTimeline(fullText, clauses, metadata);
    const executiveSummaryData = generateExecutiveSummaryData(contractDoc.contractType, metadata, riskAnalysis.risks);

    const obligationsSummary = await this.contractAgent.analyzeObligations(clauses, metadata);
    const executiveSummary = `Executive Contract Assessment: This ${contractDoc.contractType} exhibits an overall risk score of ${riskAnalysis.overallScore}/100 (${riskAnalysis.riskLevel} Risk). Analysis detected ${riskAnalysis.risks.length} distinct contractual risk factors, including ${riskAnalysis.risks.filter(r => r.level === 'Critical').length} Critical-level exposures. ${obligationsSummary.summary}`;

    // 5. Build final analysis object
    const finalAnalysis: Omit<ContractAnalysis, 'id' | 'analyzedAt'> = {
      contractId,
      overallScore: riskAnalysis.overallScore,
      riskLevel: riskAnalysis.riskLevel,
      executiveSummary,
      executiveSummaryData,
      metadata,
      risks: riskAnalysis.risks,
      clauses,
      categoryScores: riskAnalysis.categoryScores,
      recommendations: riskAnalysis.recommendations,
      timeline: timelineEvents,
      obligations: obligationsList,
      isDemoMode: config.isDemoMode
    };

    // 6. Save analysis to repository and update contract status
    const savedAnalysis = await repo.saveAnalysis(finalAnalysis);
    await repo.updateContract(contractId, {
      status: 'ANALYZED',
      overallScore: riskAnalysis.overallScore,
      riskLevel: riskAnalysis.riskLevel,
      processingProgress: 100,
      processingStage: 'Analysis Complete'
    });

    await repo.logAudit('CONTRACT_ANALYZED', 'contract', contractId, contractDoc.userId, {
      durationMs: Date.now() - startTime,
      score: riskAnalysis.overallScore,
      riskCount: riskAnalysis.risks.length
    });

    return savedAnalysis;
  }

  /**
   * RAG Contract Chat Flow with Hybrid Retrieval and Verification
   */
  async answerContractQuestion(contractId: string, question: string): Promise<ChatMessage> {
    const repo = await getRepository();
    const llm = getLLMProvider();

    // 1. Hybrid Retrieval: fetch top relevant contract chunks and legal sources
    const retrieval = await this.retriever.retrieve(contractId, question, 4);

    // 2. Build Grounded Prompt
    const contextLines = retrieval.contractChunks.map(c =>
      `[Clause/Section ${c.chunk.sectionNumber || 'N/A'} (Page ${c.chunk.pageNumber})]: ${c.chunk.text}`
    ).join('\n\n');

    const legalContextLines = retrieval.legalSources.map(s =>
      `[Legal Source: ${s.title} (${s.source}, ${s.jurisdiction})]: ${s.contentSnippet}`
    ).join('\n\n');

    const prompt = `Context from Contract:
${contextLines || 'No directly matching contract clauses found.'}

External Legal Knowledge:
${legalContextLines || 'None.'}

Question: ${question}

Instructions:
1. Answer the question based strictly and grounded on the provided contract context.
2. If evidence is insufficient, state: "I could not find sufficient evidence in the available documents to answer this confidently."
3. Do not fabricate citations or clauses.`;

    // 3. LLM Completion
    const llmResponse = await llm.generateText(prompt);

    // 4. Verification Agent checks response against retrieved chunks
    const allClauses = await repo.getClausesByContractId(contractId);
    const verification = this.verificationAgent.verifyClaim(
      llmResponse.content,
      retrieval.contractChunks.map(c => c.chunk),
      allClauses
    );

    // Combine contract citations and legal source citations
    const citations = [
      ...verification.groundedCitations,
      ...retrieval.legalSources.map(s => ({
        type: 'legal_source' as const,
        title: s.title,
        source: `${s.source} (${s.jurisdiction})`,
        text: s.contentSnippet
      }))
    ];

    // 5. Save and return chat message
    const chatMsg = await repo.saveChatMessage(contractId, {
      role: 'assistant',
      content: llmResponse.content,
      confidence: verification.confidence,
      citations,
      warnings: verification.warnings,
      verified: verification.verified
    });

    return chatMsg;
  }

  /**
   * Contract Comparison Flow
   */
  async compareContracts(contractIdA: string, contractIdB: string): Promise<ComparisonResult> {
    const repo = await getRepository();
    const [docA, docB, clausesA, clausesB, analysisA, analysisB] = await Promise.all([
      repo.getContractById(contractIdA),
      repo.getContractById(contractIdB),
      repo.getClausesByContractId(contractIdA),
      repo.getClausesByContractId(contractIdB),
      repo.getAnalysisByContractId(contractIdA),
      repo.getAnalysisByContractId(contractIdB)
    ]);

    if (!docA || !docB) throw new Error('One or both contracts for comparison not found');
    if (!analysisA || !analysisB) throw new Error('Both contracts must be analyzed prior to comparison');

    return this.comparisonAgent.compareContracts(docA, clausesA, analysisA, docB, clausesB, analysisB);
  }
}
