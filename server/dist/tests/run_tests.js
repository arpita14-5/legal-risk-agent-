"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const riskScoringEngine_js_1 = require("../services/riskScoringEngine.js");
const metadataExtractor_js_1 = require("../services/metadataExtractor.js");
const riskDetector_js_1 = require("../services/riskDetector.js");
const comparisonAgent_js_1 = require("../agents/comparisonAgent.js");
const verificationAgent_js_1 = require("../agents/verificationAgent.js");
const demoAIProvider_js_1 = require("../ai/demoAIProvider.js");
const repository_js_1 = require("../db/repository.js");
const env_js_1 = require("../config/env.js");
let passed = 0;
let failed = 0;
async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✓ ${name}`);
        passed++;
    }
    catch (err) {
        console.error(`  ✗ ${name}:`, err.message);
        failed++;
    }
}
async function runAllTests() {
    console.log('\n========================================================================');
    console.log('   🧪 Running LexGuard Backend Automated Test Suite');
    console.log('========================================================================\n');
    console.log('--- 1. Authentication & Security Tests ---');
    await test('Password hashing with bcrypt produces irreversible salt', async () => {
        const raw = 'SecureLegalPass2025!';
        const salt = await bcryptjs_1.default.genSalt(10);
        const hash = await bcryptjs_1.default.hash(raw, salt);
        assert_1.default.notStrictEqual(raw, hash);
        const valid = await bcryptjs_1.default.compare(raw, hash);
        assert_1.default.strictEqual(valid, true);
        const invalid = await bcryptjs_1.default.compare('WrongPass', hash);
        assert_1.default.strictEqual(invalid, false);
    });
    await test('JWT signing and payload verification', () => {
        const payload = { id: 'usr-123', email: 'lawyer@firm.com', role: 'user' };
        const token = jsonwebtoken_1.default.sign(payload, env_js_1.config.jwtSecret, { expiresIn: '1h' });
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
        assert_1.default.strictEqual(decoded.id, 'usr-123');
        assert_1.default.strictEqual(decoded.email, 'lawyer@firm.com');
    });
    console.log('\n--- 2. Deterministic Risk Scoring Engine Tests ---');
    const scoringEngine = new riskScoringEngine_js_1.RiskScoringEngine();
    await test('Calculates individual risk score correctly (Severity=5, Prob=4, Impact=5)', () => {
        // 5 * 4 * 5 = 100 out of 125 -> 80%
        const res = scoringEngine.calculateIndividualRiskScore(5, 4, 5);
        assert_1.default.strictEqual(res.score, 80);
        assert_1.default.strictEqual(res.level, 'Critical');
    });
    await test('Categorizes Low Risk correctly (Severity=2, Prob=2, Impact=2)', () => {
        // 2 * 2 * 2 = 8 out of 125 -> 6.4% -> 6
        const res = scoringEngine.calculateIndividualRiskScore(2, 2, 2);
        assert_1.default.strictEqual(res.score <= 25, true);
        assert_1.default.strictEqual(res.level, 'Low');
    });
    await test('Aggregates overall contract score with critical floor guarantee', () => {
        const fakeRisks = [
            {
                id: 'r1',
                category: 'Financial',
                severity: 5,
                probability: 5,
                impact: 5,
                score: 100,
                level: 'Critical'
            }
        ];
        const overall = scoringEngine.calculateContractOverallScore(fakeRisks);
        assert_1.default.strictEqual(['Critical', 'High'].includes(overall.riskLevel), true);
        assert_1.default.strictEqual(overall.overallScore >= 68, true);
    });
    console.log('\n--- 3. Explainable Risk Detection & Negotiation Assistant Tests ---');
    await test('Risk detection generates explainable detectionReason, confidence, and suggested counter-draft', () => {
        const clauseText = 'Under no circumstances shall either party\'s liability be capped or limited, and each party shall bear unlimited liability for all direct and indirect damages.';
        const fakeClause = {
            id: 'c-test-1',
            contractId: 'test-contract',
            clauseNumber: 'Section 8.1',
            clauseType: 'Liability',
            title: 'Limitation of Liability',
            pageNumber: 4,
            text: clauseText,
            confidence: 0.95
        };
        const risks = (0, riskDetector_js_1.detectContractRisks)([fakeClause], clauseText, 'test-contract');
        assert_1.default.strictEqual(risks.length > 0, true);
        const liabilityRisk = risks.find(r => r.category === 'Financial');
        assert_1.default.strictEqual(!!liabilityRisk, true);
        assert_1.default.strictEqual(typeof liabilityRisk.detectionReason, 'string');
        assert_1.default.strictEqual(typeof liabilityRisk.suggestedClause, 'string');
        assert_1.default.strictEqual(typeof liabilityRisk.negotiationPoint, 'string');
        assert_1.default.strictEqual(liabilityRisk.confidence >= 0.9, true);
        assert_1.default.strictEqual(liabilityRisk.contractEvidence.section, 'Section 8.1');
        assert_1.default.strictEqual(liabilityRisk.contractEvidence.page, 4);
        assert_1.default.strictEqual(liabilityRisk.score >= 76, true);
    });
    console.log('\n--- 4. Dates, Obligations & Executive Summary Extractor Tests ---');
    await test('Extracts comprehensive timeline events and obligations', () => {
        const sampleText = `This Master Services Agreement is entered into as of March 1, 2025 by and between Alpha Corp and Beta Services Inc.
    Fees are payable Net 30 days. The initial term shall continue for a period of 1 year and automatically renew unless notice is given 60 days prior.
    Either party may terminate upon 30 days written notice. Confidentiality obligations shall survive for a period of 3 years.`;
        const meta = (0, metadataExtractor_js_1.extractContractMetadata)(sampleText);
        assert_1.default.strictEqual(meta.parties.length >= 2, true);
        assert_1.default.strictEqual(meta.effectiveDate?.includes('March 1, 2025'), true);
        const timeline = (0, metadataExtractor_js_1.extractContractTimeline)(sampleText, [], meta);
        assert_1.default.strictEqual(timeline.length >= 4, true);
        assert_1.default.strictEqual(timeline.some(t => t.type === 'effective'), true);
        assert_1.default.strictEqual(timeline.some(t => t.type === 'renewal'), true);
        const obligations = (0, metadataExtractor_js_1.extractContractObligations)(sampleText, [], meta);
        assert_1.default.strictEqual(obligations.length >= 3, true);
        const execSummary = (0, metadataExtractor_js_1.generateExecutiveSummaryData)('Master Services Agreement', meta, []);
        assert_1.default.strictEqual(execSummary.parties.length >= 2, true);
        assert_1.default.strictEqual(execSummary.contractType, 'Master Services Agreement');
    });
    console.log('\n--- 5. Contract Version Comparison & Clause Diff Tests ---');
    await test('ComparisonAgent identifies added, removed, and modified clauses with risk delta', async () => {
        const comparisonAgent = new comparisonAgent_js_1.ComparisonAgent();
        const docA = { id: 'doc-a', title: 'Contract v1' };
        const docB = { id: 'doc-b', title: 'Contract v2' };
        const clausesA = [
            { id: 'c1', clauseType: 'Liability', clauseNumber: '8.1', text: 'Liability is unlimited and uncapped for both parties.' },
            { id: 'c2', clauseType: 'Renewal', clauseNumber: '3.1', text: 'This agreement shall automatically renew for successive 1-year terms.' }
        ];
        const clausesB = [
            { id: 'c3', clauseType: 'Liability', clauseNumber: '8.1', text: 'Total aggregate liability shall not exceed fees paid in the prior 12 months.' },
            { id: 'c4', clauseType: 'Data Protection', clauseNumber: '11.1', text: 'Provider shall comply with GDPR Article 28 data protection requirements.' }
        ];
        const analysisA = { overallScore: 82, riskLevel: 'Critical' };
        const analysisB = { overallScore: 45, riskLevel: 'Moderate' };
        const result = await comparisonAgent.compareContracts(docA, clausesA, analysisA, docB, clausesB, analysisB);
        assert_1.default.strictEqual(result.saferContractId, 'doc-b');
        assert_1.default.strictEqual(result.riskScoreDelta, -37);
        assert_1.default.strictEqual(result.clauseDiffs && result.clauseDiffs.length >= 2, true);
        const modifiedLiability = result.clauseDiffs?.find(d => d.clauseType === 'Liability');
        assert_1.default.strictEqual(modifiedLiability?.type, 'modified');
        assert_1.default.strictEqual(modifiedLiability?.riskScoreImpact < 0, true);
    });
    console.log('\n--- 6. Human Feedback Storage & Summary Tests ---');
    await test('Repository saves and calculates human feedback summary', async () => {
        const repo = await (0, repository_js_1.getRepository)();
        const testContractId = 'test-feedback-contract-1';
        await repo.saveRiskFeedback({
            contractId: testContractId,
            riskId: 'risk-101',
            userId: 'usr-1',
            feedback: 'correct',
            notes: 'Confirmed uncapped liability clause exists.'
        });
        await repo.saveRiskFeedback({
            contractId: testContractId,
            riskId: 'risk-102',
            userId: 'usr-1',
            feedback: 'incorrect',
            notes: 'Carve-out in Section 8.3 mitigates this.'
        });
        const feedbackList = await repo.getRiskFeedback(testContractId);
        assert_1.default.strictEqual(feedbackList.length >= 2, true);
        const summary = await repo.getFeedbackSummary();
        assert_1.default.strictEqual(summary.total >= 2, true);
        assert_1.default.strictEqual(summary.correct >= 1, true);
        assert_1.default.strictEqual(summary.incorrect >= 1, true);
    });
    console.log('\n--- 7. Anti-Hallucination & Exact Citation Chat Tests ---');
    await test('Demo AI provider cites exact section and page for grounded answers', async () => {
        const provider = new demoAIProvider_js_1.DemoLLMProvider();
        const groundedPrompt = `Context from Contract:
[Clause/Section 8.2 (Page 4)]: Each party's aggregate liability under this Agreement shall not exceed the total fees paid by Customer in the preceding twelve months.

Question: What is the liability cap?`;
        const res = await provider.generateText(groundedPrompt);
        assert_1.default.strictEqual(res.content.includes('Section 8.2'), true);
        assert_1.default.strictEqual(res.content.includes('Page 4'), true);
        assert_1.default.strictEqual(res.content.includes('aggregate liability'), true);
    });
    await test('Demo AI provider refuses without hallucinating when evidence is absent', async () => {
        const provider = new demoAIProvider_js_1.DemoLLMProvider();
        const ungroundedPrompt = `Context from Contract:
[Clause/Section 1.1 (Page 1)]: This Agreement is entered into by Alpha and Beta.

Question: Does this contract require compliance with HIPAA healthcare regulations?`;
        const res = await provider.generateText(ungroundedPrompt);
        assert_1.default.strictEqual(res.content.includes('could not find sufficient evidence'), true);
    });
    console.log('\n--- 8. Vector Math & RAG Verification Tests ---');
    await test('Cosine similarity mathematical precision', () => {
        const v1 = [1, 0, 0];
        const v2 = [1, 0, 0];
        const v3 = [0, 1, 0];
        assert_1.default.strictEqual((0, repository_js_1.cosineSimilarity)(v1, v2), 1.0);
        assert_1.default.strictEqual((0, repository_js_1.cosineSimilarity)(v1, v3), 0.0);
    });
    await test('Verification Agent grounds valid claims against retrieved chunks', () => {
        const verifier = new verificationAgent_js_1.VerificationAgent();
        const fakeChunk = {
            id: 'c-1',
            pageNumber: 3,
            sectionNumber: 'Section 4.1',
            sectionTitle: 'Termination Rights',
            text: 'Either party may terminate this agreement upon 60 days advance written notice.'
        };
        const answer = 'According to Section 4.1, either party may terminate upon 60 days written notice.';
        const result = verifier.verifyClaim(answer, [fakeChunk], []);
        assert_1.default.strictEqual(result.verified, true);
        assert_1.default.strictEqual(result.groundedCitations.length > 0, true);
    });
    console.log('\n========================================================================');
    console.log(`   🎉 Test Results: ${passed} passed, ${failed} failed`);
    console.log('========================================================================\n');
    if (failed > 0)
        process.exit(1);
}
runAllTests().catch(e => {
    console.error(e);
    process.exit(1);
});
