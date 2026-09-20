export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
}

export type ContractStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'FAILED';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type RiskCategory =
  | 'Financial'
  | 'Legal'
  | 'Operational'
  | 'Compliance'
  | 'Privacy'
  | 'Intellectual Property'
  | 'Commercial';

export type ClauseCategory =
  | 'Parties'
  | 'Definitions'
  | 'Payment'
  | 'Term'
  | 'Renewal'
  | 'Termination'
  | 'Liability'
  | 'Indemnification'
  | 'Confidentiality'
  | 'Intellectual Property'
  | 'Data Protection'
  | 'Privacy'
  | 'Warranties'
  | 'Representations'
  | 'Non-compete'
  | 'Non-solicitation'
  | 'Dispute Resolution'
  | 'Governing Law'
  | 'Force Majeure'
  | 'Assignment'
  | 'Audit'
  | 'Insurance'
  | 'Miscellaneous';

export interface Clause {
  id: string;
  contractId: string;
  clauseNumber?: string;
  clauseType: ClauseCategory;
  title?: string;
  pageNumber: number;
  text: string;
  confidence: number;
  favorableTo?: 'mutual' | 'client' | 'counterparty' | 'unfavorable_to_all';
}

export interface ContractEvidence {
  page: number;
  section: string;
  text: string;
  highlightCoordinates?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface LegalSourceCitation {
  id: string;
  title: string;
  source: string;
  jurisdiction: string;
  section?: string;
  url?: string;
  contentSnippet: string;
}

export interface RiskFinding {
  id: string;
  contractId: string;
  title: string;
  category: RiskCategory;
  severity: number;    // 1 - 5
  probability: number; // 1 - 5
  impact: number;      // 1 - 5
  score: number;       // 0 - 100
  level: RiskLevel;
  description: string;
  whyItMatters: string;
  recommendation: string;
  contractEvidence: ContractEvidence;
  legalSources?: LegalSourceCitation[];
  verified?: boolean;
  // Explainable Risk Analysis & Negotiation Assistant extensions
  detectionReason?: string;
  clauseTitle?: string;
  confidence?: number;
  suggestedClause?: string;
  negotiationPoint?: string;
  humanFeedback?: 'correct' | 'incorrect';
}

export interface ContractTimelineEvent {
  id: string;
  title: string;
  dateOrPeriod: string;
  type: 'effective' | 'expiry' | 'renewal' | 'notice' | 'payment' | 'milestone' | 'obligation';
  description: string;
  status?: 'upcoming' | 'milestone' | 'critical' | 'recurring';
  clauseReference?: string;
}

export interface ContractObligation {
  id: string;
  party: string;
  description: string;
  category: 'Payment' | 'Compliance' | 'Delivery' | 'Reporting' | 'Audit' | 'Confidentiality' | 'General';
  deadlineOrFrequency?: string;
  clauseReference?: string;
}

export interface ContractExecutiveSummary {
  contractType: string;
  parties: string[];
  effectiveDate?: string;
  expirationDate?: string;
  termDuration?: string;
  renewalTerms?: string;
  terminationTerms?: string;
  paymentTerms?: string;
  ipTerms?: string;
  liabilityCapTerms?: string;
  governingLaw?: string;
  topRisks: {
    id: string;
    title: string;
    level: RiskLevel;
    score: number;
    category: RiskCategory;
  }[];
  keyTakeaways: string[];
}

export interface RiskFeedback {
  id: string;
  contractId: string;
  riskId: string;
  userId?: string;
  feedback: 'correct' | 'incorrect';
  notes?: string;
  createdAt: string;
}

export interface ClauseDiff {
  id: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  clauseType: ClauseCategory | string;
  sectionNumber?: string;
  title?: string;
  textA?: string;
  textB?: string;
  riskImpact: string;
  riskScoreImpact?: number;
}

export interface StructuredContractMetadata {
  parties: string[];
  effectiveDate?: string;
  expirationDate?: string;
  contractDuration?: string;
  renewalPeriod?: string;
  paymentAmount?: string;
  paymentSchedule?: string;
  noticePeriod?: string;
  governingLaw?: string;
  jurisdiction?: string;
  terminationRights?: string;
  liabilityCap?: string;
  indemnificationObligations?: string;
  ipOwnership?: string;
  confidentialityPeriod?: string;
  dataProcessingObligations?: string;
}

export interface ContractAnalysis {
  id: string;
  contractId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  executiveSummary: string;
  executiveSummaryData?: ContractExecutiveSummary;
  metadata: StructuredContractMetadata;
  risks: RiskFinding[];
  clauses: Clause[];
  categoryScores: Record<RiskCategory, number>;
  recommendations: string[];
  timeline?: ContractTimelineEvent[];
  obligations?: ContractObligation[];
  analyzedAt: string;
  isDemoMode?: boolean;
}

export interface ContractDocument {
  id: string;
  userId: string;
  title: string;
  contractType: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx';
  filePath: string;
  status: ContractStatus;
  overallScore?: number;
  riskLevel?: RiskLevel;
  processingProgress?: number;
  processingStage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  contractId: string;
  chunkIndex: number;
  pageNumber: number;
  sectionNumber?: string;
  sectionTitle?: string;
  clauseType?: ClauseCategory;
  text: string;
  embedding?: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  citations?: {
    type: 'contract' | 'legal_source';
    page?: number;
    section?: string;
    text: string;
    title?: string;
    source?: string;
  }[];
  warnings?: string[];
  verified?: boolean;
  timestamp: string;
}

export interface ComparisonCategoryDiff {
  category: string;
  contractAValue: string;
  contractBValue: string;
  assessment: 'A safer' | 'B safer' | 'Equal / Mutual' | 'Both risky';
  evidenceA?: string;
  evidenceB?: string;
  rationale: string;
}

export interface ComparisonResult {
  contractA: { id: string; title: string; overallScore: number; riskLevel: RiskLevel };
  contractB: { id: string; title: string; overallScore: number; riskLevel: RiskLevel };
  overallRecommendation: string;
  saferContractId: string;
  categories: ComparisonCategoryDiff[];
  clauseDiffs?: ClauseDiff[];
  riskScoreDelta?: number;
  keyDifferencesSummary?: string[];
}

export interface SystemObservability {
  totalDocumentsProcessed: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTimeMs: number;
  averageRetrievalLatencyMs: number;
  totalChunksIndexed: number;
  averageChunksRetrieved: number;
  aiTokenUsage: number;
  activeProvider: string;
}
