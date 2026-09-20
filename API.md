# LexGuard REST API Specification

All protected endpoints require an `Authorization: Bearer <jwt_token>` header.

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "name": "Elena Vance, Esq.",
    "email": "counsel@firm.com",
    "password": "password123",
    "role": "user" // "user" | "admin"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": { "id": "...", "email": "...", "name": "...", "role": "user" },
    "token": "eyJhbGciOi..."
  }
  ```

### `POST /api/auth/login`
Authenticates existing credentials.
- **Request Body**:
  ```json
  { "email": "counsel@lexguard.ai", "password": "password123" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "user": { "id": "...", "email": "...", "name": "...", "role": "user" },
    "token": "eyJhbGciOi..."
  }
  ```

### `GET /api/auth/me`
Fetches active user profile from JWT token.

---

## 2. Contract Management Endpoints

### `GET /api/contracts`
Lists contracts belonging to the authenticated user.
- **Query Parameters**:
  - `search`: String matching title or file name
  - `status`: `UPLOADED` | `PROCESSING` | `ANALYZED` | `FAILED`
  - `riskLevel`: `Low` | `Moderate` | `High` | `Critical`
  - `type`: Contract category
- **Response (200 OK)**:
  ```json
  { "contracts": [ { "id": "...", "title": "...", "status": "ANALYZED", "overallScore": 78, "riskLevel": "Critical" } ] }
  ```

### `POST /api/contracts`
Uploads a contract (PDF or DOCX).
- **Form Data**:
  - `document`: File binary
  - `title`: Contract Title
  - `contractType`: Category (e.g. "Master Services Agreement")
- **Response (201 Created)**:
  Returns contract record with initial `status: "PROCESSING"`. Background multi-agent audit starts asynchronously.

### `GET /api/contracts/:id`
Returns contract metadata by ID.

### `DELETE /api/contracts/:id`
Permanently deletes contract, chunks, vectors, risks, and uploaded files.

---

## 3. Analysis & Risk Endpoints

### `POST /api/contracts/:id/analyze`
Triggers or forces a re-analysis of the specified contract.

### `GET /api/contracts/:id/analysis`
Fetches complete multi-agent analysis result:
```json
{
  "analysis": {
    "id": "...",
    "contractId": "...",
    "overallScore": 78,
    "riskLevel": "Critical",
    "executiveSummary": "...",
    "categoryScores": { "Financial": 80, "Legal": 65, "Operational": 60, ... },
    "recommendations": [ "..." ],
    "risks": [ ... ],
    "clauses": [ ... ]
  }
}
```

### `GET /api/contracts/:id/risks`
Fetches individual risk findings for a contract.

### `GET /api/contracts/:id/clauses`
Fetches classified clauses with confidence and favorability ratings.

### `GET /api/contracts/:id/report`
Returns formal, printer-ready HTML Contract Risk Audit Report.

---

## 4. Grounded Contract Chat

### `POST /api/contracts/:id/chat`
Sends conversational question to the contract's RAG pipeline.
- **Request Body**:
  ```json
  { "question": "Does this contract have an automatic renewal clause?" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": {
      "id": "...",
      "role": "assistant",
      "content": "Yes. The agreement contains an automatic renewal provision...",
      "confidence": 0.95,
      "verified": true,
      "citations": [
        {
          "type": "contract",
          "page": 1,
          "section": "Section 2.0",
          "text": "Upon expiration of the initial term, this Agreement shall automatically renew..."
        }
      ]
    }
  }
  ```

### `GET /api/contracts/:id/chat`
Returns conversation history for this contract.

---

## 5. Contract Comparison

### `POST /api/compare`
Compares Contract A and Contract B side-by-side across 9 dimensions.
- **Request Body**:
  ```json
  { "contractIdA": "id-1", "contractIdB": "id-2" }
  ```
- **Response (200 OK)**:
  Returns comparative assessments, evidence quotes, and overall safer contract recommendation.

---

## 6. Legal Knowledge Base & Observability

### `GET /api/legal-sources`
Lists authoritative legal sources (GDPR, UCC, DTSA, etc.).

### `POST /api/legal-sources` (Admin Only)
Indexes a new statutory or case precedent into the vector knowledge base.

### `GET /api/search`
Global hybrid search across contracts, clauses, risks, and statutes.

### `GET /api/admin/observability` (Admin Only)
Returns system telemetry, retrieval latency, chunk counts, token usage, and live audit logs.