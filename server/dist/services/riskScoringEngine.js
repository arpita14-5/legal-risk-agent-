"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScoringEngine = void 0;
const CATEGORY_WEIGHTS = {
    Financial: 1.3,
    Legal: 1.2,
    Operational: 1.0,
    Compliance: 1.2,
    Privacy: 1.1,
    'Intellectual Property': 1.3,
    Commercial: 1.0
};
class RiskScoringEngine {
    /**
     * Deterministically calculates individual risk score
     * Formula: (Severity * Probability * Impact / 125) * 100
     */
    calculateIndividualRiskScore(severity, probability, impact) {
        const raw = Math.max(1, Math.min(5, severity)) *
            Math.max(1, Math.min(5, probability)) *
            Math.max(1, Math.min(5, impact));
        const score = Math.round((raw / 125) * 100);
        let level = 'Low';
        if (score >= 76)
            level = 'Critical';
        else if (score >= 51)
            level = 'High';
        else if (score >= 26)
            level = 'Moderate';
        return { score, level };
    }
    /**
     * Aggregates individual risks into overall contract risk metrics
     */
    calculateContractOverallScore(risks) {
        const categoryScores = {
            Financial: 0,
            Legal: 0,
            Operational: 0,
            Compliance: 0,
            Privacy: 0,
            'Intellectual Property': 0,
            Commercial: 0
        };
        if (risks.length === 0) {
            return {
                overallScore: 12, // Baseline clean contract score
                riskLevel: 'Low',
                categoryScores
            };
        }
        // Group scores by category
        const categoryRiskLists = {
            Financial: [],
            Legal: [],
            Operational: [],
            Compliance: [],
            Privacy: [],
            'Intellectual Property': [],
            Commercial: []
        };
        for (const r of risks) {
            if (categoryRiskLists[r.category]) {
                categoryRiskLists[r.category].push(r.score);
            }
        }
        // Calculate per-category score (using maximum + dampening secondary risks)
        for (const cat of Object.keys(categoryRiskLists)) {
            const list = categoryRiskLists[cat].sort((a, b) => b - a);
            if (list.length === 0) {
                categoryScores[cat] = 0;
            }
            else {
                const top = list[0];
                const secondary = list.slice(1).reduce((acc, curr) => acc + curr * 0.2, 0);
                categoryScores[cat] = Math.min(100, Math.round(top + secondary));
            }
        }
        // Weighted aggregation
        let totalWeightedScore = 0;
        let totalWeight = 0;
        for (const cat of Object.keys(categoryScores)) {
            const weight = CATEGORY_WEIGHTS[cat];
            totalWeightedScore += categoryScores[cat] * weight;
            totalWeight += weight;
        }
        const aggregated = Math.round(totalWeightedScore / totalWeight);
        // If any critical risk exists (score >= 76), contract floor cannot be lower than 65
        const hasCritical = risks.some(r => r.level === 'Critical');
        const finalScore = hasCritical ? Math.max(68, aggregated) : aggregated;
        let riskLevel = 'Low';
        if (finalScore >= 76)
            riskLevel = 'Critical';
        else if (finalScore >= 51)
            riskLevel = 'High';
        else if (finalScore >= 26)
            riskLevel = 'Moderate';
        return {
            overallScore: finalScore,
            riskLevel,
            categoryScores
        };
    }
}
exports.RiskScoringEngine = RiskScoringEngine;
