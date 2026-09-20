"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAgent = void 0;
const riskDetector_js_1 = require("../services/riskDetector.js");
const riskScoringEngine_js_1 = require("../services/riskScoringEngine.js");
class RiskAgent {
    name = 'Risk Analysis Agent';
    scoringEngine = new riskScoringEngine_js_1.RiskScoringEngine();
    async evaluateContractRisks(clauses, fullText, contractId) {
        // 1. Detect all matching risks
        const risks = (0, riskDetector_js_1.detectContractRisks)(clauses, fullText, contractId);
        // 2. Compute deterministic scores
        const { overallScore, riskLevel, categoryScores } = this.scoringEngine.calculateContractOverallScore(risks);
        // 3. Compile top recommendations
        const recommendations = [];
        for (const r of risks.filter(x => x.level === 'Critical' || x.level === 'High')) {
            recommendations.push(`[${r.category}] ${r.title}: ${r.recommendation}`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Overall agreement provisions align with standard balanced commercial terms. Ensure operational notice dates are tracked.');
        }
        return {
            risks,
            overallScore,
            riskLevel,
            categoryScores,
            recommendations
        };
    }
}
exports.RiskAgent = RiskAgent;
