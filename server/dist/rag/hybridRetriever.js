"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridRetriever = void 0;
const repository_js_1 = require("../db/repository.js");
const providerFactory_js_1 = require("../ai/providerFactory.js");
class HybridRetriever {
    kConstant = 60; // Standard RRF smoothing constant
    async retrieve(contractId, query, topK = 4) {
        const repo = await (0, repository_js_1.getRepository)();
        const embedder = (0, providerFactory_js_1.getEmbeddingProvider)();
        // 1. Generate query embedding
        let queryEmbedding = [];
        try {
            queryEmbedding = await embedder.generateEmbedding(query);
        }
        catch (e) {
            console.warn('Query embedding generation failed, using keyword-only retrieval.');
        }
        // 2. Parallel Vector & Keyword Search
        const [vectorResults, keywordResults, legalSources] = await Promise.all([
            queryEmbedding.length > 0 ? repo.searchChunksVector(contractId, queryEmbedding, 10) : [],
            repo.searchChunksKeyword(contractId, query, 10),
            repo.searchLegalSources(query, queryEmbedding.length > 0 ? queryEmbedding : undefined, 2)
        ]);
        // 3. Reciprocal Rank Fusion (RRF)
        const chunkScores = new Map();
        vectorResults.forEach((res, rank) => {
            const id = res.chunk.id;
            const score = 1.0 / (this.kConstant + rank + 1);
            chunkScores.set(id, {
                chunk: res.chunk,
                rrfScore: score,
                vectorRank: rank + 1
            });
        });
        keywordResults.forEach((res, rank) => {
            const id = res.chunk.id;
            const score = 1.0 / (this.kConstant + rank + 1);
            if (chunkScores.has(id)) {
                const item = chunkScores.get(id);
                item.rrfScore += score;
                item.keywordRank = rank + 1;
            }
            else {
                chunkScores.set(id, {
                    chunk: res.chunk,
                    rrfScore: score,
                    keywordRank: rank + 1
                });
            }
        });
        // 4. Sort by blended RRF Score
        const fusedList = Array.from(chunkScores.values());
        fusedList.sort((a, b) => b.rrfScore - a.rrfScore);
        return {
            contractChunks: fusedList.slice(0, topK),
            legalSources
        };
    }
}
exports.HybridRetriever = HybridRetriever;
