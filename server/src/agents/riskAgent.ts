import { detectContractRisks } from '../services/riskDetector.js';
import { RiskScoringEngine } from '../services/riskScoringEngine.js';
import type { Clause, RiskFinding, RiskCategory, RiskLevel } from '../types/shared.js';

export class RiskAgent {
  name = 'Risk Analysis Agent';
  private scoringEngine = new RiskScoringEngine();

  async evaluateContractRisks(clauses: Clause[], fullText: string, contractId: string): Promise<{
    risks: RiskFinding[];
    overallScore: number;
    riskLevel: RiskLevel;
    categoryScores: Record<RiskCategory, number>;
    recommendations: string[];
  }> {
    // 1. Detect all matching risks
    const risks = detectContractRisks(clauses, fullText, contractId);

    // 2. Compute deterministic scores
    const { overallScore, riskLevel, categoryScores } = this.scoringEngine.calculateContractOverallScore(risks);

    // 3. Compile top recommendations
    const recommendations: string[] = [];
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
