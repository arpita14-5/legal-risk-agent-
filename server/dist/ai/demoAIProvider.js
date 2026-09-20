"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoLLMProvider = exports.DemoEmbeddingProvider = void 0;
// Legal Concept Dimension Projection (384 dimensions)
const LEGAL_VOCAB = [
    'liability', 'damages', 'consequential', 'limitation', 'cap', 'unlimited', 'gross negligence',
    'indemnification', 'indemnify', 'hold harmless', 'defense', 'third party claim', 'loss',
    'termination', 'convenience', 'cause', 'breach', 'notice period', 'cure period', 'immediate',
    'renewal', 'automatic renewal', 'evergreen', 'opt-out', 'written notice', 'term',
    'confidentiality', 'proprietary', 'non-disclosure', 'trade secret', 'disclosure', 'recipient',
    'intellectual property', 'ownership', 'work made for hire', 'patent', 'copyright', 'license',
    'payment', 'invoice', 'interest', 'net 30', 'late fee', 'compensation', 'billing', 'taxes',
    'dispute resolution', 'arbitration', 'mediation', 'court', 'litigation', 'venue', 'jury waiver',
    'governing law', 'jurisdiction', 'state of delaware', 'new york', 'california', 'laws',
    'data protection', 'privacy', 'gdpr', 'ccpa', 'personal data', 'security breach', 'dpa',
    'non-compete', 'non-solicitation', 'restrictive covenant', 'restraint of trade', 'solicit',
    'force majeure', 'act of god', 'pandemic', 'war', 'unforeseeable', 'suspension',
    'audit', 'inspection', 'books and records', 'compliance', 'investigation',
    'warranty', 'representation', 'disclaimer', 'as is', 'merchantability', 'fitness'
];
class DemoEmbeddingProvider {
    name = 'Demo Lexical-Semantic Dense Embedder';
    dimension = 384;
    async generateEmbedding(text) {
        const vec = new Array(this.dimension).fill(0);
        const normalized = text.toLowerCase();
        // 1. Project against curated legal concept anchors
        for (let i = 0; i < LEGAL_VOCAB.length; i++) {
            const term = LEGAL_VOCAB[i];
            if (normalized.includes(term)) {
                const idx = (i * 3) % this.dimension;
                vec[idx] += 2.5;
                vec[(idx + 1) % this.dimension] += 1.8;
                vec[(idx + 2) % this.dimension] += 1.2;
            }
        }
        // 2. Add n-gram subword hashing to capture general semantic similarity
        for (let i = 0; i < normalized.length - 3; i++) {
            const charCode = normalized.charCodeAt(i) * 31 + normalized.charCodeAt(i + 1) * 17 + normalized.charCodeAt(i + 2);
            const slot = Math.abs(charCode) % this.dimension;
            vec[slot] += 0.05;
        }
        // 3. L2 Normalize vector to unit length
        let sumSq = 0;
        for (let i = 0; i < this.dimension; i++) {
            sumSq += vec[i] * vec[i];
        }
        const norm = Math.sqrt(sumSq) || 1.0;
        return vec.map(v => Number((v / norm).toFixed(6)));
    }
    async generateBatchEmbeddings(texts) {
        return Promise.all(texts.map(t => this.generateEmbedding(t)));
    }
}
exports.DemoEmbeddingProvider = DemoEmbeddingProvider;
class DemoLLMProvider {
    name = 'Demo Legal AI Engine (Rule & NLP Grounded)';
    async generateText(prompt, _systemPrompt) {
        // 1. Extract Question
        const queryMatch = prompt.match(/Question:\s*([^\n\r]*)/i);
        const userQuery = queryMatch ? queryMatch[1].trim() : prompt;
        const lowerQuery = userQuery.toLowerCase();
        // 2. Extract Context Chunks from Prompt
        const parsedChunks = [];
        const chunkRegex = /\[Clause\/Section\s+([^\]\(\)]+?)(?:\s+\(Page\s+(\d+)\))?\]:\s*([\s\S]*?)(?=\n\n\[Clause\/Section|\n\nExternal Legal Knowledge:|\n\nQuestion:|$)/gi;
        let match;
        while ((match = chunkRegex.exec(prompt)) !== null) {
            parsedChunks.push({
                section: match[1].trim(),
                page: match[2] ? parseInt(match[2], 10) : 1,
                text: match[3].trim()
            });
        }
        // 3. Score chunks against question keywords
        const queryTerms = lowerQuery.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'does', 'have', 'with', 'about', 'from', 'this', 'that'].includes(w));
        let bestChunk = null;
        let maxOverlap = 0;
        for (const chunk of parsedChunks) {
            const lowerText = chunk.text.toLowerCase();
            let overlap = 0;
            for (const term of queryTerms) {
                if (lowerText.includes(term) || chunk.section.toLowerCase().includes(term)) {
                    overlap++;
                }
            }
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestChunk = chunk;
            }
        }
        let response = '';
        if (!bestChunk || maxOverlap === 0) {
            // Zero-hallucination refusal when evidence is unavailable
            response = `I could not find sufficient evidence in the contract to answer this question. No corresponding clause was identified in the available document sections.`;
        }
        else {
            // Evidence-grounded answer citing exact contract section and page
            const sectionRef = `Section ${bestChunk.section} (Page ${bestChunk.page})`;
            const cleanSnippet = bestChunk.text.slice(0, 200).replace(/\s+/g, ' ');
            if (lowerQuery.includes('renew') || lowerQuery.includes('automatic')) {
                if (/renew|term|successive/i.test(bestChunk.text)) {
                    response = `According to ${sectionRef}, the contract provides: "${cleanSnippet}...". Specifically, this section establishes the renewal terms governing whether the agreement automatically extends or requires affirmative written notice.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding renewal terms.`;
                }
            }
            else if (lowerQuery.includes('terminat') || lowerQuery.includes('cancel')) {
                if (/terminat|notice|cure|breach/i.test(bestChunk.text)) {
                    response = `Pursuant to ${sectionRef}, the agreement stipulates: "${cleanSnippet}...". Under these terms, termination rights and mandatory written notice windows are enforced as specified.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding termination provisions.`;
                }
            }
            else if (lowerQuery.includes('liab') || lowerQuery.includes('damag') || lowerQuery.includes('cap')) {
                if (/liab|damag|cap|exceed|loss/i.test(bestChunk.text)) {
                    response = `Under ${sectionRef}, the contract states: "${cleanSnippet}...". This covenant defines the limitations on aggregate damages and the scope of liability exclusions between the parties.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding liability limits.`;
                }
            }
            else if (lowerQuery.includes('ip') || lowerQuery.includes('intellectual property') || lowerQuery.includes('patent') || lowerQuery.includes('ownership')) {
                if (/intellectual|property|work|inventions|license|patent/i.test(bestChunk.text)) {
                    response = `As outlined in ${sectionRef}, the agreement specifies: "${cleanSnippet}...". This section governs intellectual property rights, distinguishing pre-existing Background IP from project deliverables.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding intellectual property ownership.`;
                }
            }
            else if (lowerQuery.includes('payment') || lowerQuery.includes('fee') || lowerQuery.includes('invoice') || lowerQuery.includes('interest')) {
                if (/pay|fee|invoic|due|net/i.test(bestChunk.text)) {
                    response = `Per ${sectionRef}, the payment provisions state: "${cleanSnippet}...". Invoices and disbursement obligations are governed by this schedule.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding payment terms.`;
                }
            }
            else if (lowerQuery.includes('law') || lowerQuery.includes('jurisdiction') || lowerQuery.includes('court') || lowerQuery.includes('dispute')) {
                if (/law|jurisdiction|court|dispute|arbitration/i.test(bestChunk.text)) {
                    response = `According to ${sectionRef}, the agreement provides: "${cleanSnippet}...". This establishes governing law and the designated venue for legal disputes.`;
                }
                else {
                    response = `I could not find sufficient evidence in the contract regarding governing law or jurisdiction.`;
                }
            }
            else {
                response = `Based on ${sectionRef}, the contract addresses this topic as follows: "${cleanSnippet}...". Please refer to this exact clause for complete contractual terms.`;
            }
        }
        return {
            content: response,
            tokensUsed: Math.round(response.length / 4) + 120,
            model: 'demo-legal-nlp-v1'
        };
    }
    async generateStructured(_prompt, _systemPrompt) {
        return {};
    }
}
exports.DemoLLMProvider = DemoLLMProvider;
