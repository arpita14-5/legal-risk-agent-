"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonAgent = void 0;
const uuid_1 = require("uuid");
class ComparisonAgent {
    name = 'Contract Comparison Agent';
    async compareContracts(docA, clausesA, analysisA, docB, clausesB, analysisB) {
        const categoriesToCompare = [
            'Liability',
            'Termination',
            'Renewal',
            'Intellectual Property',
            'Confidentiality',
            'Payment',
            'Dispute Resolution',
            'Governing Law',
            'Data Protection'
        ];
        const diffs = [];
        const clauseDiffs = [];
        const keyDifferencesSummary = [];
        // 1. High-Level Categorical Comparison
        for (const cat of categoriesToCompare) {
            const clauseA = clausesA.find(c => c.clauseType === cat);
            const clauseB = clausesB.find(c => c.clauseType === cat);
            const valA = clauseA ? clauseA.text.slice(0, 220) + (clauseA.text.length > 220 ? '...' : '') : 'No specific clause detected';
            const valB = clauseB ? clauseB.text.slice(0, 220) + (clauseB.text.length > 220 ? '...' : '') : 'No specific clause detected';
            let assessment = 'Equal / Mutual';
            let rationale = 'Both contracts feature comparable standard commercial language in this category.';
            if (cat === 'Liability') {
                const hasUncapA = /unlimited|no cap/i.test(clauseA?.text || '');
                const hasUncapB = /unlimited|no cap/i.test(clauseB?.text || '');
                if (hasUncapA && !hasUncapB) {
                    assessment = 'B safer';
                    rationale = 'Contract B includes a monetary liability cap whereas Contract A imposes uncapped liability exposure.';
                }
                else if (!hasUncapA && hasUncapB) {
                    assessment = 'A safer';
                    rationale = 'Contract A includes a liability cap whereas Contract B has open-ended exposure.';
                }
            }
            else if (cat === 'Termination') {
                const noticeA = (clauseA?.text.match(/(\d+)\s*days/i) || [])[1];
                const noticeB = (clauseB?.text.match(/(\d+)\s*days/i) || [])[1];
                const daysA = noticeA ? parseInt(noticeA, 10) : 30;
                const daysB = noticeB ? parseInt(noticeB, 10) : 30;
                if (daysB > daysA) {
                    assessment = 'B safer';
                    rationale = `Contract B allows a longer ${daysB}-day transition/cure notice period compared to Contract A (${daysA} days).`;
                }
                else if (daysA > daysB) {
                    assessment = 'A safer';
                    rationale = `Contract A provides a more generous ${daysA}-day notice window compared to Contract B (${daysB} days).`;
                }
            }
            else if (cat === 'Renewal') {
                const autoA = /automatically renew/i.test(clauseA?.text || '');
                const autoB = /automatically renew/i.test(clauseB?.text || '');
                if (autoA && !autoB) {
                    assessment = 'B safer';
                    rationale = 'Contract B requires explicit affirmative renewal, avoiding the evergreen renewal trap present in Contract A.';
                }
                else if (!autoA && autoB) {
                    assessment = 'A safer';
                    rationale = 'Contract A does not automatically renew, providing greater commercial flexibility.';
                }
            }
            diffs.push({
                category: cat,
                contractAValue: valA,
                contractBValue: valB,
                assessment,
                evidenceA: clauseA ? `Section ${clauseA.clauseNumber || 'clause'}, p. ${clauseA.pageNumber}` : undefined,
                evidenceB: clauseB ? `Section ${clauseB.clauseNumber || 'clause'}, p. ${clauseB.pageNumber}` : undefined,
                rationale
            });
        }
        // 2. Granular Clause-Level Diffs: Added, Removed, and Modified Clauses
        const processedTypesInB = new Set();
        for (const cA of clausesA) {
            const matchInB = clausesB.find(cB => cB.clauseType === cA.clauseType);
            if (!matchInB) {
                // Removed in B
                const riskImpact = `Clause removed in Version B. Eliminates specific ${cA.clauseType} covenants from baseline.`;
                clauseDiffs.push({
                    id: (0, uuid_1.v4)(),
                    type: 'removed',
                    clauseType: cA.clauseType,
                    sectionNumber: cA.clauseNumber,
                    title: cA.title || `${cA.clauseType} Terms`,
                    textA: cA.text,
                    riskImpact,
                    riskScoreImpact: 0
                });
                keyDifferencesSummary.push(`Removed clause: ${cA.clauseType} present in Version A is omitted in Version B.`);
            }
            else {
                processedTypesInB.add(matchInB.id);
                const normA = cA.text.trim().toLowerCase().replace(/\s+/g, ' ');
                const normB = matchInB.text.trim().toLowerCase().replace(/\s+/g, ' ');
                if (normA !== normB) {
                    // Modified clause
                    let riskImpact = `Clause modified between versions.`;
                    let scoreImpact = 0;
                    if (cA.clauseType === 'Liability') {
                        if (/unlimited/i.test(normA) && !/unlimited/i.test(normB)) {
                            riskImpact = 'Critical Risk Eliminated: Version B institutes a liability cap, eliminating uncapped balance-sheet exposure.';
                            scoreImpact = -25;
                        }
                        else if (!/unlimited/i.test(normA) && /unlimited/i.test(normB)) {
                            riskImpact = 'Critical Risk Added: Version B removes the liability ceiling, introducing unlimited financial exposure.';
                            scoreImpact = 25;
                        }
                    }
                    else if (cA.clauseType === 'Renewal') {
                        if (/automatically renew/i.test(normA) && !/automatically renew/i.test(normB)) {
                            riskImpact = 'Commercial Risk Mitigated: Version B removes the evergreen auto-renewal lock-in.';
                            scoreImpact = -12;
                        }
                    }
                    else if (cA.clauseType === 'Termination') {
                        riskImpact = 'Notice & Cure terms adjusted. Review operational transition runway.';
                        scoreImpact = -5;
                    }
                    else if (cA.clauseType === 'Intellectual Property') {
                        if (!/background ip/i.test(normA) && /background ip/i.test(normB)) {
                            riskImpact = 'IP Protection Enhanced: Version B explicitly carves out and protects pre-existing Background IP.';
                            scoreImpact = -18;
                        }
                    }
                    clauseDiffs.push({
                        id: (0, uuid_1.v4)(),
                        type: 'modified',
                        clauseType: cA.clauseType,
                        sectionNumber: matchInB.clauseNumber || cA.clauseNumber,
                        title: matchInB.title || cA.title || `${cA.clauseType} Modification`,
                        textA: cA.text,
                        textB: matchInB.text,
                        riskImpact,
                        riskScoreImpact: scoreImpact
                    });
                    keyDifferencesSummary.push(`Modified ${cA.clauseType}: ${riskImpact}`);
                }
            }
        }
        // Identify clauses added in B (not in A)
        for (const cB of clausesB) {
            if (!processedTypesInB.has(cB.id) && !clausesA.some(cA => cA.clauseType === cB.clauseType)) {
                const riskImpact = `New clause added in Version B. Introduces new covenants governing ${cB.clauseType}.`;
                clauseDiffs.push({
                    id: (0, uuid_1.v4)(),
                    type: 'added',
                    clauseType: cB.clauseType,
                    sectionNumber: cB.clauseNumber,
                    title: cB.title || `New ${cB.clauseType} Clause`,
                    textB: cB.text,
                    riskImpact,
                    riskScoreImpact: 5
                });
                keyDifferencesSummary.push(`Added clause: Version B introduces new ${cB.clauseType} provisions.`);
            }
        }
        const saferContractId = analysisA.overallScore <= analysisB.overallScore ? docA.id : docB.id;
        const saferTitle = analysisA.overallScore <= analysisB.overallScore ? docA.title : docB.title;
        const saferScore = Math.min(analysisA.overallScore, analysisB.overallScore);
        const riskScoreDelta = analysisB.overallScore - analysisA.overallScore;
        const deltaDescription = riskScoreDelta < 0
            ? `Version B achieves a lower risk score by ${Math.abs(riskScoreDelta)} points (from ${analysisA.overallScore} down to ${analysisB.overallScore}).`
            : riskScoreDelta > 0
                ? `Version A presents a lower risk score by ${riskScoreDelta} points (Score: ${analysisA.overallScore} vs ${analysisB.overallScore}).`
                : `Both contracts share identical aggregate risk ratings (${analysisA.overallScore}/100).`;
        const overallRecommendation = `Between the two agreements, "${saferTitle}" presents a lower aggregate risk profile (Score: ${saferScore}/100). ${deltaDescription}`;
        return {
            contractA: { id: docA.id, title: docA.title, overallScore: analysisA.overallScore, riskLevel: analysisA.riskLevel },
            contractB: { id: docB.id, title: docB.title, overallScore: analysisB.overallScore, riskLevel: analysisB.riskLevel },
            overallRecommendation,
            saferContractId,
            categories: diffs,
            clauseDiffs,
            riskScoreDelta,
            keyDifferencesSummary
        };
    }
}
exports.ComparisonAgent = ComparisonAgent;
