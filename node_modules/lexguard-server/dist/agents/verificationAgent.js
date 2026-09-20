"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationAgent = void 0;
class VerificationAgent {
    name = 'Claim Verification Agent';
    /**
     * Cross-references an AI generated answer or claim against retrieved chunks and contract clauses
     */
    verifyClaim(answer, retrievedChunks, fullClauses) {
        const warnings = [];
        let supportedCitations = 0;
        const groundedCitations = [];
        // 1. If answer expresses lack of evidence, it is grounded as a refusal
        if (answer.toLowerCase().includes('could not find sufficient evidence') || answer.toLowerCase().includes('not enough evidence')) {
            return {
                verified: true,
                confidence: 0.95,
                warnings: [],
                groundedCitations: []
            };
        }
        // 2. Validate cited chunks
        for (const chunk of retrievedChunks) {
            // Check if key phrases from chunk text or section appear in answer
            const keySnippet = chunk.text.slice(0, 150);
            const words = keySnippet.toLowerCase().split(/\s+/).filter(w => w.length > 4);
            const matchCount = words.filter(w => answer.toLowerCase().includes(w)).length;
            if (matchCount >= 2 || (chunk.sectionTitle && answer.toLowerCase().includes(chunk.sectionTitle.toLowerCase()))) {
                supportedCitations++;
                groundedCitations.push({
                    type: 'contract',
                    page: chunk.pageNumber,
                    section: chunk.sectionNumber || chunk.sectionTitle || 'Clause',
                    text: chunk.text.slice(0, 250),
                    title: chunk.sectionTitle
                });
            }
        }
        // 3. Detect potential hallucination indicators
        if (retrievedChunks.length > 0 && supportedCitations === 0) {
            warnings.push('The generated response contains claims with low direct textual overlap with retrieved clauses.');
        }
        const confidence = supportedCitations > 0 ? Math.min(0.98, 0.70 + supportedCitations * 0.1) : 0.45;
        const verified = supportedCitations > 0 || retrievedChunks.length === 0;
        return {
            verified,
            confidence,
            warnings,
            groundedCitations: groundedCitations.slice(0, 3)
        };
    }
}
exports.VerificationAgent = VerificationAgent;
