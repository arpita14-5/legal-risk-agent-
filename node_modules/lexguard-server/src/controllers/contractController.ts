import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getRepository } from '../db/repository.js';
import { DocumentProcessor } from '../services/documentProcessor.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { ReportGenerator } from '../services/reportGenerator.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const processor = new DocumentProcessor();
const orchestrator = new AgentOrchestrator();
const reportGen = new ReportGenerator();

export async function uploadContract(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'No contract document uploaded' });

    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
    const contractType = req.body.contractType || 'Master Services Agreement';
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '') as 'pdf' | 'docx';

    const repo = await getRepository();
    const contract = await repo.createContract({
      userId: req.user.id,
      title,
      contractType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: ext,
      filePath: req.file.path,
      status: 'PROCESSING',
      processingProgress: 10,
      processingStage: 'Document uploaded'
    });

    // Start background processing pipeline
    (async () => {
      try {
        await repo.updateContract(contract.id, {
          processingProgress: 25,
          processingStage: 'Extracting text and structure'
        });

        const processed = await processor.processFile(req.file!.path, ext, contract.id);

        await repo.updateContract(contract.id, {
          processingProgress: 50,
          processingStage: 'Classifying clauses and semantic chunking'
        });

        const savedClauses = await repo.saveClauses(contract.id, processed.clauses);
        await repo.saveChunks(contract.id, processed.chunks);

        await repo.updateContract(contract.id, {
          processingProgress: 75,
          processingStage: 'Indexing vector embeddings'
        });

        await repo.updateContract(contract.id, {
          processingProgress: 90,
          processingStage: 'Running multi-agent risk analysis'
        });

        await orchestrator.runFullAnalysis(contract.id, processed.fullText, savedClauses);
        console.log(`✓ Contract ${contract.id} analyzed successfully.`);
      } catch (pipelineErr) {
        console.error(`Pipeline error on contract ${contract.id}:`, pipelineErr);
        await repo.updateContract(contract.id, {
          status: 'FAILED',
          processingStage: `Failed: ${(pipelineErr as Error).message}`
        });
      }
    })();

    return res.status(201).json({ contract });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listContracts(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const repo = await getRepository();
    const { search, status, riskLevel, type } = req.query;

    const contracts = await repo.listContracts(req.user.id, {
      search: search as string,
      status: status as string,
      riskLevel: riskLevel as string,
      type: type as string
    });

    return res.json({ contracts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getContract(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const contract = await repo.getContractById(id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    return res.json({ contract });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteContract(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const contract = await repo.getContractById(id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    if (fs.existsSync(contract.filePath)) {
      try { fs.unlinkSync(contract.filePath); } catch (e) {}
    }

    await repo.deleteContract(id);
    await repo.logAudit('CONTRACT_DELETED', 'contract', id, req.user?.id);
    return res.json({ success: true, message: 'Contract deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function analyzeContract(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const contract = await repo.getContractById(id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    await repo.updateContract(id, { status: 'PROCESSING', processingProgress: 30, processingStage: 'Re-analyzing document' });

    const processed = await processor.processFile(contract.filePath, contract.fileType, contract.id);
    const savedClauses = await repo.saveClauses(contract.id, processed.clauses);
    await repo.saveChunks(contract.id, processed.chunks);

    const analysis = await orchestrator.runFullAnalysis(contract.id, processed.fullText, savedClauses);

    return res.json({ analysis });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAnalysis(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const analysis = await repo.getAnalysisByContractId(id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found for this contract' });
    return res.json({ analysis });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getRisks(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const risks = await repo.getRisksByContractId(id);
    return res.json({ risks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getClauses(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const clauses = await repo.getClausesByContractId(id);
    return res.json({ clauses });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const contract = await repo.getContractById(id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    const analysis = await repo.getAnalysisByContractId(id);
    if (!analysis) return res.status(404).json({ error: 'Contract has not been analyzed yet' });

    const html = reportGen.generateHtmlReport(contract, analysis);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function submitRiskFeedback(req: AuthRequest, res: Response) {
  try {
    const { id, riskId } = req.params;
    const { feedback, notes } = req.body;

    if (!feedback || !['correct', 'incorrect'].includes(feedback)) {
      return res.status(400).json({ error: 'Feedback must be either "correct" or "incorrect"' });
    }

    const repo = await getRepository();
    const saved = await repo.saveRiskFeedback({
      contractId: id,
      riskId,
      userId: req.user?.id,
      feedback,
      notes
    });

    await repo.logAudit('RISK_FEEDBACK_SUBMITTED', 'risk_finding', riskId, req.user?.id, {
      contractId: id,
      feedback,
      notes
    });

    return res.json({ feedback: saved, message: 'Feedback stored successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getContractRiskFeedback(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const feedback = await repo.getRiskFeedback(id);
    return res.json({ feedback });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getFeedbackEvaluationSummary(req: AuthRequest, res: Response) {
  try {
    const repo = await getRepository();
    const summary = await repo.getFeedbackSummary();
    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

