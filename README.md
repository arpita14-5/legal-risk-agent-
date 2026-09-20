# LexGuard: AI Legal Intelligence & Contract Risk Analysis Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![License: Educational](https://img.shields.io/badge/License-Educational_Capston-amber.svg)](#legal-disclaimer)

> **Final-Year Academic Capstone Project**: An enterprise-grade AI legal intelligence and contract risk audit platform combining multi-agent orchestration, structure-aware semantic chunking, reciprocal rank fusion (RRF) hybrid RAG, deterministic risk scoring, interactive PDF clause highlighting, and anti-hallucination verification.

---

## 1. Project Overview
Reviewing commercial agreements (e.g. Master Services Agreements, NDAs, SaaS Licenses, Vendor Contracts) requires extensive legal expertise to spot high-liability pitfalls. LexGuard brings automated contract intelligence to legal teams by:
- Ingesting PDF and Word documents with structure-aware clause extraction.
- Classifying clauses into **23 legal categories** with confidence and favorability scoring.
- Detecting **22+ dangerous contractual risks** (unlimited liability, unilateral termination, automatic renewal traps, broad IP forfeiture, etc.).
- Computing a **deterministic, explainable risk score** ($S \times P \times I$) normalized to $0 - 100$.
- Providing **interactive PDF/document clause highlighting** that jumps directly to the target clause when a risk finding is clicked.
- Delivering **grounded conversational Q&A** with verifiable citations and statutory references (UCC, GDPR, DGCL).
- Enabling **side-by-side contract comparison** across 9 key legal dimensions.

---

## 2. Key Features

- **Document Processing Pipeline**: Parses PDFs (`pdf-parse`) and DOCXs (`mammoth`), detects numbering and section hierarchies (`Section 1.1`, `Article IV`), and performs structure-aware chunking preserving exact page and clause metadata.
- **23 Clause Classifiers**: Parties, Definitions, Payment, Term, Renewal, Termination, Liability, Indemnification, Confidentiality, Intellectual Property, Data Protection, Privacy, Warranties, Representations, Non-compete, Non-solicitation, Dispute Resolution, Governing Law, Force Majeure, Assignment, Audit, Insurance, Miscellaneous.
- **22+ Risk Detectors**: Unlimited liability, missing liability cap, broad indemnification, one-sided termination, short termination notice, evergreen renewal traps, excessive late penalties, broad IP assignment, restrictive non-competes, data privacy gaps, and foreign jurisdiction risks.
- **Deterministic Risk Scoring Engine**: Eliminates arbitrary LLM scoring hallucination via the rigorous formula:
  $$\text{Risk Score} = \min\left(100, \text{round}\left(\frac{\text{Severity} \times \text{Probability} \times \text{Impact}}{125} \times 100\right)\right)$$
- **Interactive PDF & Clause Highlighting**: Selecting any risk card flips the document viewer directly to the target page and highlights the clause evidence with glowing markers and pulse animation.
- **Hybrid RAG with Reciprocal Rank Fusion (RRF)**: Merges dense vector cosine similarity with lexical BM25 token matching ($k = 60$).
- **Multi-Agent Orchestration Layer**: Contract Agent, Risk Agent, Research Agent, Comparison Agent, and Verification Agent coordinate document evaluation and fact-checking.
- **Anti-Hallucination Claim Verification**: Flags unverified claims and issues honest refusals whenever contract evidence is insufficient.
- **Side-by-Side Contract Comparison**: Compares two contracts across 9 legal categories with favorability grading ("A safer", "B safer", "Equal / Mutual").
- **Legal Reference Precedent Library**: Authoritative statutory sources (GDPR Art. 28, UCC § 2-719, DGCL § 145, DTSA 18 U.S.C. § 1836).
- **Executive Audit Report Export**: Printable and downloadable 12-section Contract Risk Audit Report.
- **Zero-Friction Fallback AI & Storage Mode**: Seamlessly works out-of-the-box in local demo mode without requiring Docker, external PostgreSQL, or live API keys!

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Custom Dark/Light LegalTech SaaS aesthetic)
- **Routing**: React Router DOM v7
- **Data Fetching**: TanStack React Query + Axios
- **Visualizations**: Recharts (Risk distribution, category exposure index)
- **Icons**: Lucide React
- **Document Viewing**: Interactive Paginated Canvas with clause jump and visual highlighting

### Backend
- **Runtime**: Node.js v22 (LTS)
- **Language**: TypeScript (Strict Mode)
- **Web Framework**: Express.js
- **Validation**: Zod
- **Authentication**: JWT tokens + bcryptjs password hashing
- **File Ingestion**: Multer (PDF & DOCX parsing via `pdf-parse` & `mammoth`)

### Database & Storage
- **Primary**: PostgreSQL with `pgvector`
- **Fallback**: Embedded Vector Store with in-process mathematical Cosine Similarity and JSON persistence for instant zero-dependency execution.

### AI & Vector Retrieval
- **Providers**: OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), Google Gemini (`gemini-1.5-flash`), and Deterministic NLP Grounded Demo AI Engine.

---

## 4. System Architecture

```
React Frontend (Vite + Tailwind)
       │
       ▼ REST APIs & JWT
Express.js + TypeScript Backend
       │
   ┌───┴───────────────────────────────┐
   ▼                                   ▼
Storage Layer                     AI Multi-Agent Layer
(pgvector / Embedded Fallback)         │
   │                               ┌───┴───────────────┐
   ▼                               ▼                   ▼
Document Processing Pipeline   RAG Retrieval     Agent Orchestrator
   │                               │                   │
   ├── PDF/DOCX Parser             ├── Dense Vector    ├── Contract Agent
   ├── Section Detection           ├── Lexical BM25    ├── Risk Agent
   ├── 23 Clause Classifiers       └── RRF Fusion      ├── Research Agent
   └── Semantic Chunker                                ├── Comparison Agent
                                                       └── Verification Agent
```

---

## 5. Folder Structure
```
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── api/                # API client and service endpoints
│   │   ├── components/         # Reusable UI components (Viewer, Badge, Meter, Chat)
│   │   ├── context/            # AuthContext with demo credentials
│   │   ├── pages/              # Landing, Dashboard, Contracts, Analysis, Compare
│   │   └── types/              # Frontend TypeScript definitions
│   └── package.json
├── server/                     # Backend Node.js / Express application
│   ├── src/
│   │   ├── agents/             # Multi-agent orchestrator & individual agents
│   │   ├── ai/                 # OpenAI, Gemini & Demo AI providers
│   │   ├── controllers/        # REST API controllers
│   │   ├── db/                 # Postgres connection, schema.sql, repository, seed.ts
│   │   ├── evaluation/         # Academic benchmark dataset & evaluation runner
│   │   ├── middleware/         # Auth, Multer upload & error handling
│   │   ├── rag/                # Hybrid retriever (Vector + Keyword + RRF)
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Document parser, classifier, risk detector, scorer
│   │   └── tests/              # Backend automated test suite
│   ├── uploads/                # Local uploaded contract documents
│   └── package.json
├── shared/                     # Shared TypeScript interfaces
│   └── types.ts
├── ARCHITECTURE.md             # Detailed architectural specification
├── API.md                      # Complete REST API reference
├── RAG.md                      # Hybrid RAG & retrieval documentation
├── AGENTS.md                   # Multi-agent roles & risk scoring formulas
├── DATABASE.md                 # Schema definitions & ERD
└── package.json                # Root workspace orchestrator
```

---

## 6. Pre-seeded Demo Data
LexGuard comes with 3 fully indexed, realistic contracts ready for immediate inspection:
1. **Master Services Agreement - CloudTech Enterprise**: Critical Risk (Score: 78/100). Demonstrates unlimited liability, unilateral termination for convenience, 3-year non-compete, and automatic evergreen renewal.
2. **Mutual Non-Disclosure Agreement - Apex Health**: Moderate Risk (Score: 38/100). Demonstrates 5-year post-termination survival and broad confidential information definitions.
3. **Vendor Software Agreement - SecureStack Technologies**: Low Risk (Score: 18/100). Demonstrates balanced 12-month fee liability cap and mutual 60-day convenience termination.

---

## 7. Environment Variables (`.env`)
```bash
# Server Port & Secret
PORT=5000
JWT_SECRET=lexguard_academic_secret_jwt_key_2025
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL + pgvector)
# If left blank or unreachable, LexGuard automatically activates its embedded fallback!
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lexguard

# AI Provider Configuration
# Set to "demo", "openai", or "gemini"
AI_PROVIDER=demo

# Optional: Live LLM Keys
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

---

## 8. Installation & Running Locally

### Step 1: Clone and Install
```bash
cd "c:\Users\kshpa\OneDrive\Desktop\legal risk agent"
npm install
```

### Step 2: Start Development Servers
```bash
# Starts backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```
Open your browser at `http://localhost:5173`.

### Step 3: Instant Login Credentials
Use the pre-seeded accounts or click the **One-Click Demo Login** buttons on the login screen:
- **Legal Counsel**: `counsel@lexguard.ai` / `password123`
- **Chief Administrator**: `admin@lexguard.ai` / `password123`

---

## 9. Automated Testing & Academic Evaluation

### Run Backend Automated Unit Tests
```bash
npm run test --workspace=server
```
Runs 9 comprehensive automated tests verifying JWT security, password salting, deterministic risk calculation ($S \times P \times I$), clause classification, metadata extraction, cosine similarity, and verification agent claim grounding.

### Run Academic RAG & Classification Benchmark
```bash
npm run eval --workspace=server
```
Executes the evaluation dataset across labeled legal clauses, producing standard academic metrics:
- **Clause Classification Precision, Recall, and F1**: $100.0\%$
- **Risk Detection Precision, Recall, and F1**: $100.0\%$ / $91.7\%$ / $95.7\%$
- **Hybrid Retrieval Recall@3 & Recall@5**: $80.0\%$ / $100.0\%$

---

## 10. Limitations & Future Work
- **Optical Character Recognition (OCR)**: Scanned image-only PDFs currently require external OCR preprocessing before upload.
- **Multilingual Support**: Present rule classifiers and lexical dictionaries target English-language commercial agreements. Future releases can incorporate multilingual embeddings.
- **Integration with CLM**: Future versions can connect via webhooks to DocuSign, Ironclad, and Salesforce.

---

## 11. Legal Disclaimer
> **IMPORTANT NOTICE**:
> LexGuard provides AI-generated legal information and contract analysis for informational and educational purposes only. It does not constitute legal advice. Important legal decisions should be reviewed by a qualified legal professional.