import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { classifyClauseText } from './clauseClassifier.js';
import { extractContractMetadata } from './metadataExtractor.js';
import { getEmbeddingProvider } from '../ai/providerFactory.js';
import type { Clause, DocumentChunk, StructuredContractMetadata } from '../types/shared.js';

export interface ProcessedDocumentResult {
  fullText: string;
  pageCount: number;
  metadata: StructuredContractMetadata;
  clauses: Omit<Clause, 'id'>[];
  chunks: Omit<DocumentChunk, 'id'>[];
}

export class DocumentProcessor {
  async processFile(filePath: string, fileType: 'pdf' | 'docx', contractId: string): Promise<ProcessedDocumentResult> {
    const buffer = fs.readFileSync(filePath);
    let fullText = '';
    let pageCount = 1;

    if (fileType === 'pdf') {
      try {
        const parsed = await pdfParse(buffer);
        fullText = parsed.text;
        pageCount = parsed.numpages || 1;
      } catch (err) {
        console.warn('PDF parsing fallback, using raw buffer conversion:', (err as Error).message);
        fullText = buffer.toString('utf-8');
      }
    } else {
      const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
      if (isZip) {
        try {
          const parsed = await mammoth.extractRawText({ buffer });
          fullText = parsed.value;
          pageCount = Math.max(1, Math.ceil(fullText.length / 3000));
        } catch (err) {
          fullText = buffer.toString('utf-8');
        }
      } else {
        fullText = buffer.toString('utf-8');
        pageCount = Math.max(1, Math.ceil(fullText.length / 3000));
      }
    }

    fullText = this.cleanText(fullText);
    const metadata = extractContractMetadata(fullText);
    const { clauses, chunks } = await this.parseStructureAndChunk(fullText, contractId, pageCount);

    return {
      fullText,
      pageCount,
      metadata,
      clauses,
      chunks
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private async parseStructureAndChunk(
    fullText: string,
    contractId: string,
    totalEstimatedPages: number
  ): Promise<{ clauses: Omit<Clause, 'id'>[]; chunks: Omit<DocumentChunk, 'id'>[] }> {
    const paragraphs = fullText.split(/\n\n+/);
    const clauses: Omit<Clause, 'id'>[] = [];
    const chunks: Omit<DocumentChunk, 'id'>[] = [];

    let currentSectionNum = '1.0';
    let currentSectionTitle = 'Preamble';
    let currentClauseText = '';
    let chunkIndex = 0;

    const charCount = fullText.length;
    const charsPerPage = Math.max(1, Math.floor(charCount / Math.max(1, totalEstimatedPages)));

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (!p) continue;

      const approxPage = Math.min(
        totalEstimatedPages,
        Math.max(1, Math.ceil((fullText.indexOf(p) + 1) / charsPerPage))
      );

      // Section header pattern: "1. Term", "SECTION 4: INDEMNIFICATION", "Article III - Payment"
      const sectionMatch = p.match(/^(?:(?:Section|Article|Clause)\s+)?([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[\.\:\-]\s*([A-Z0-9\s,\/]{3,60})/i);

      if (sectionMatch) {
        // Finalize previous clause if accumulated
        if (currentClauseText.length > 50) {
          const { category, confidence, favorableTo } = classifyClauseText(currentClauseText, currentSectionTitle);
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
      } else {
        currentClauseText += '\n\n' + p;

        // If paragraph is long enough (> 1200 chars), break chunk to avoid dilution
        if (currentClauseText.length > 1500) {
          const { category, confidence, favorableTo } = classifyClauseText(currentClauseText, currentSectionTitle);
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
      const { category, confidence, favorableTo } = classifyClauseText(currentClauseText, currentSectionTitle);
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
      const embedder = getEmbeddingProvider();
      const textsToEmbed = chunks.map(c => `${c.sectionTitle || ''}: ${c.text}`);
      const embeddings = await embedder.generateBatchEmbeddings(textsToEmbed);
      chunks.forEach((chunk, idx) => {
        chunk.embedding = embeddings[idx];
      });
    } catch (err) {
      console.warn('Embedding batch generation failed:', (err as Error).message);
    }

    return { clauses, chunks };
  }
}
