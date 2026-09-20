"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessor = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const clauseClassifier_js_1 = require("./clauseClassifier.js");
const metadataExtractor_js_1 = require("./metadataExtractor.js");
const providerFactory_js_1 = require("../ai/providerFactory.js");
class DocumentProcessor {
    async processFile(filePath, fileType, contractId) {
        const buffer = fs_1.default.readFileSync(filePath);
        let fullText = '';
        let pageCount = 1;
        if (fileType === 'pdf') {
            try {
                const parsed = await (0, pdf_parse_1.default)(buffer);
                fullText = parsed.text;
                pageCount = parsed.numpages || 1;
            }
            catch (err) {
                console.warn('PDF parsing fallback, using raw buffer conversion:', err.message);
                fullText = buffer.toString('utf-8');
            }
        }
        else {
            const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
            if (isZip) {
                try {
                    const parsed = await mammoth_1.default.extractRawText({ buffer });
                    fullText = parsed.value;
                    pageCount = Math.max(1, Math.ceil(fullText.length / 3000));
                }
                catch (err) {
                    fullText = buffer.toString('utf-8');
                }
            }
            else {
                fullText = buffer.toString('utf-8');
                pageCount = Math.max(1, Math.ceil(fullText.length / 3000));
            }
        }
        fullText = this.cleanText(fullText);
        const metadata = (0, metadataExtractor_js_1.extractContractMetadata)(fullText);
        const { clauses, chunks } = await this.parseStructureAndChunk(fullText, contractId, pageCount);
        return {
            fullText,
            pageCount,
            metadata,
            clauses,
            chunks
        };
    }
    cleanText(text) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    async parseStructureAndChunk(fullText, contractId, totalEstimatedPages) {
        const paragraphs = fullText.split(/\n\n+/);
        const clauses = [];
        const chunks = [];
        let currentSectionNum = '1.0';
        let currentSectionTitle = 'Preamble';
        let currentClauseText = '';
        let chunkIndex = 0;
        const charCount = fullText.length;
        const charsPerPage = Math.max(1, Math.floor(charCount / Math.max(1, totalEstimatedPages)));
        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i].trim();
            if (!p)
                continue;
            const approxPage = Math.min(totalEstimatedPages, Math.max(1, Math.ceil((fullText.indexOf(p) + 1) / charsPerPage)));
            // Section header pattern: "1. Term", "SECTION 4: INDEMNIFICATION", "Article III - Payment"
            const sectionMatch = p.match(/^(?:(?:Section|Article|Clause)\s+)?([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[\.\:\-]\s*([A-Z0-9\s,\/]{3,60})/i);
            if (sectionMatch) {
                // Finalize previous clause if accumulated
                if (currentClauseText.length > 50) {
                    const { category, confidence, favorableTo } = (0, clauseClassifier_js_1.classifyClauseText)(currentClauseText, currentSectionTitle);
                    clauses.push({
                        contractId,
                        clauseNumber: currentSectionNum,
                        clauseType: category,
                        title: currentSectionTitle,
                        pageNumber: approxPage,
                        text: currentClauseText.trim(),
                        confidence,
                        favorableTo
                    });
                    // Create semantic chunk
                    chunks.push({
                        contractId,
                        chunkIndex: chunkIndex++,
                        pageNumber: approxPage,
                        sectionNumber: currentSectionNum,
                        sectionTitle: currentSectionTitle,
                        clauseType: category,
                        text: currentClauseText.trim()
                    });
                }
                currentSectionNum = sectionMatch[1];
                currentSectionTitle = sectionMatch[2].trim();
                currentClauseText = p;
            }
            else {
                currentClauseText += '\n\n' + p;
                // If paragraph is long enough (> 1200 chars), break chunk to avoid dilution
                if (currentClauseText.length > 1500) {
                    const { category, confidence, favorableTo } = (0, clauseClassifier_js_1.classifyClauseText)(currentClauseText, currentSectionTitle);
                    clauses.push({
                        contractId,
                        clauseNumber: currentSectionNum,
                        clauseType: category,
                        title: currentSectionTitle,
                        pageNumber: approxPage,
                        text: currentClauseText.trim(),
                        confidence,
                        favorableTo
                    });
                    chunks.push({
                        contractId,
                        chunkIndex: chunkIndex++,
                        pageNumber: approxPage,
                        sectionNumber: currentSectionNum,
                        sectionTitle: currentSectionTitle,
                        clauseType: category,
                        text: currentClauseText.trim()
                    });
                    currentClauseText = '';
                }
            }
        }
        // Process remainder
        if (currentClauseText.trim().length > 30) {
            const approxPage = totalEstimatedPages;
            const { category, confidence, favorableTo } = (0, clauseClassifier_js_1.classifyClauseText)(currentClauseText, currentSectionTitle);
            clauses.push({
                contractId,
                clauseNumber: currentSectionNum,
                clauseType: category,
                title: currentSectionTitle,
                pageNumber: approxPage,
                text: currentClauseText.trim(),
                confidence,
                favorableTo
            });
            chunks.push({
                contractId,
                chunkIndex: chunkIndex++,
                pageNumber: approxPage,
                sectionNumber: currentSectionNum,
                sectionTitle: currentSectionTitle,
                clauseType: category,
                text: currentClauseText.trim()
            });
        }
        // Embed chunks
        try {
            const embedder = (0, providerFactory_js_1.getEmbeddingProvider)();
            const textsToEmbed = chunks.map(c => `${c.sectionTitle || ''}: ${c.text}`);
            const embeddings = await embedder.generateBatchEmbeddings(textsToEmbed);
            chunks.forEach((chunk, idx) => {
                chunk.embedding = embeddings[idx];
            });
        }
        catch (err) {
            console.warn('Embedding batch generation failed:', err.message);
        }
        return { clauses, chunks };
    }
}
exports.DocumentProcessor = DocumentProcessor;
