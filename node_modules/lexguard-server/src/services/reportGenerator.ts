import type { ContractDocument, ContractAnalysis, RiskFinding, ContractTimelineEvent, ContractObligation } from '../types/shared.js';

export class ReportGenerator {
  generateHtmlReport(contract: ContractDocument, analysis: ContractAnalysis): string {
    const criticalRisks = analysis.risks.filter(r => r.level === 'Critical');
    const highRisks = analysis.risks.filter(r => r.level === 'High');
    const modRisks = analysis.risks.filter(r => r.level === 'Moderate');
    const lowRisks = analysis.risks.filter(r => r.level === 'Low');

    const timeline = analysis.timeline || [];
    const obligations = analysis.obligations || [];
    const execSummary = analysis.executiveSummaryData;

    const renderRiskCard = (r: RiskFinding, badgeColor: string, badgeBg: string) => `
      <div style="border: 1px solid #e2e8f0; border-left: 5px solid ${badgeColor}; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px;">
          <div>
            <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">
              Category: ${r.category} &bull; Clause: ${r.clauseTitle || 'Contract Clause'}
            </span>
            <h4 style="margin: 3px 0 0 0; font-size: 16px; color: #0f172a; font-family: Georgia, serif;">${r.title}</h4>
          </div>
          <div style="text-align: right; shrink: 0;">
            <span style="font-size: 12px; font-weight: bold; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 3px 10px; border-radius: 9999px;">
              ${r.level} Risk (${r.score}/100)
            </span>
            <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 4px;">
              S:${r.severity} &times; P:${r.probability} &times; I:${r.impact} = ${r.severity * r.probability * r.impact}/125
            </div>
          </div>
        </div>

        ${r.detectionReason ? `
        <div style="margin: 6px 0; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #334155; border: 1px dashed #cbd5e1;">
          <strong style="color: #475569;">Why Detected:</strong> ${r.detectionReason}
          ${r.confidence ? ` <span style="font-family: monospace; color: #0284c7;">(Confidence: ${Math.round(r.confidence * 100)}%)</span>` : ''}
        </div>
        ` : ''}

        <p style="margin: 6px 0; font-size: 13px; color: #334155; line-height: 1.5;">
          <strong>Description:</strong> ${r.description}
        </p>

        <div style="margin: 6px 0; padding: 8px 12px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 12px; color: #92400e;">
          <strong>Business & Legal Impact:</strong> ${r.whyItMatters}
        </div>

        <div style="margin: 6px 0; padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #16a34a; border-radius: 4px; font-size: 12px; color: #166534;">
          <strong>Strategic Recommendation:</strong> ${r.recommendation}
        </div>

        <div style="margin-top: 10px; padding: 10px; background: #f1f5f9; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #1e293b; border: 1px solid #e2e8f0;">
          <strong style="color: #0f172a;">Direct Contract Evidence (${r.contractEvidence.section}, Page ${r.contractEvidence.page}):</strong><br/>
          <span style="font-style: italic;">&ldquo;${r.contractEvidence.text.replace(/"/g, '&quot;')}&rdquo;</span>
        </div>

        ${r.suggestedClause ? `
        <div style="margin-top: 10px; padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: #0f172a;">Suggested Counter-Draft Clause:</strong>
            <span style="font-size: 10px; font-weight: bold; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">
              SUGGESTED DRAFT &bull; NOT LEGAL ADVICE
            </span>
          </div>
          <div style="font-size: 11px; color: #334155; font-family: monospace; background: #ffffff; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; line-height: 1.4;">
            ${r.suggestedClause}
          </div>
          ${r.negotiationPoint ? `
          <div style="margin-top: 6px; font-size: 11px; color: #475569;">
            <strong>Negotiation Counter-Point:</strong> ${r.negotiationPoint}
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${r.legalSources && r.legalSources.length > 0 ? `
        <div style="margin-top: 8px; font-size: 11px; color: #0369a1; border-top: 1px solid #f1f5f9; padding-top: 6px;">
          <strong>Authoritative Legal Reference:</strong>
          ${r.legalSources.map(s => `<span>${s.title} (${s.source})</span>`).join(', ')}
        </div>
        ` : ''}
      </div>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>LexGuard Legal Audit & Risk Report - ${contract.title}</title>
  <style>
    @media print {
      body { font-size: 11pt; padding: 0 !important; background: #fff !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      a { text-decoration: none; color: inherit; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      max-width: 960px;
      margin: 0 auto;
      padding: 36px;
      background: #f8fafc;
    }
    .report-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    h1, h2, h3, h4 { color: #0f172a; }
    h2 {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 32px;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      display: inline-block;
    }
    .critical { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
    .high { background: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }
    .mod { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
    .low { background: #dcfce7; color: #166534; border: 1px solid #4ade80; }
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin: 14px 0 24px 0;
    }
    .table-custom th {
      background: #f1f5f9;
      text-align: left;
      padding: 10px;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      color: #334155;
    }
    .table-custom td {
      padding: 9px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .disclaimer-box {
      background: #fffbeb;
      border: 1px solid #fef08a;
      padding: 14px;
      border-radius: 8px;
      font-size: 12px;
      color: #854d0e;
      margin: 20px 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #d97706; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
      <span>&#128424; Print / Save as PDF</span>
    </button>
  </div>

  <div class="report-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #d97706; font-weight: bold; letter-spacing: 0.1em;">
          LexGuard Multi-Agent Intelligence
        </div>
        <h1 style="margin: 4px 0 2px 0; font-size: 26px; font-family: Georgia, serif;">Contract Risk & Compliance Audit</h1>
        <p style="margin: 0; color: #64748b; font-size: 13px;">Grounded Verification, Deterministic Scoring & Redline Advisory</p>
      </div>
      <div style="text-align: right;">
        <span class="badge ${analysis.overallScore >= 76 ? 'critical' : analysis.overallScore >= 51 ? 'high' : analysis.overallScore >= 26 ? 'mod' : 'low'}">
          Overall Risk: ${analysis.overallScore}/100 (${analysis.riskLevel})
        </span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">Report Date: ${new Date(analysis.analyzedAt).toLocaleDateString()}</p>
        <p style="margin: 2px 0 0 0; font-size: 10px; font-family: monospace; color: #94a3b8;">Doc ID: ${contract.id.slice(0, 8)}</p>
      </div>
    </div>

    <div class="disclaimer-box">
      <strong>LEGAL & REGULATORY DISCLAIMER:</strong> LexGuard provides automated contract intelligence and deterministic risk analytics for informational and preliminary counsel review purposes only. This report does not constitute formal legal counsel or create an attorney-client relationship. All suggested drafting provisions and risk evaluations should be finalized by qualified legal counsel.
    </div>

    <!-- 1. Executive Summary -->
    <h2>1. Executive Summary & Transaction Overview</h2>
    <table class="table-custom">
      <tr>
        <td style="width: 25%; font-weight: 600; background: #f8fafc;">Document Title:</td>
        <td>${contract.title}</td>
        <td style="width: 20%; font-weight: 600; background: #f8fafc;">Contract Type:</td>
        <td>${contract.contractType}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; background: #f8fafc;">Parties:</td>
        <td>${analysis.metadata.parties?.join(' &bull; ') || 'Identified in document preamble'}</td>
        <td style="font-weight: 600; background: #f8fafc;">Effective Date:</td>
        <td>${analysis.metadata.effectiveDate || 'Upon mutual execution'}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; background: #f8fafc;">Initial Term:</td>
        <td>${analysis.metadata.contractDuration || '12 Months standard'}</td>
        <td style="font-weight: 600; background: #f8fafc;">Renewal Terms:</td>
        <td>${analysis.metadata.renewalPeriod || 'Mutual written confirmation'}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; background: #f8fafc;">Payment Schedule:</td>
        <td>${analysis.metadata.paymentSchedule || 'Net 30 Days'}</td>
        <td style="font-weight: 600; background: #f8fafc;">Termination Notice:</td>
        <td>${analysis.metadata.noticePeriod || '30 days standard notice'}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; background: #f8fafc;">Liability Cap:</td>
        <td style="color: ${analysis.metadata.liabilityCap?.includes('Uncapped') ? '#b91c1c' : '#1e293b'}; font-weight: ${analysis.metadata.liabilityCap?.includes('Uncapped') ? 'bold' : 'normal'};">
          ${analysis.metadata.liabilityCap || 'Common law uncapped'}
        </td>
        <td style="font-weight: 600; background: #f8fafc;">IP Ownership:</td>
        <td>${analysis.metadata.ipOwnership || 'License grant / pre-existing IP reserved'}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; background: #f8fafc;">Governing Law:</td>
        <td>${analysis.metadata.governingLaw || 'Standard Commercial'}</td>
        <td style="font-weight: 600; background: #f8fafc;">Jurisdiction / Venue:</td>
        <td>${analysis.metadata.jurisdiction || 'State & Federal Courts'}</td>
      </tr>
    </table>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; color: #475569;">Synthesis & Counsel Takeaways</h4>
      <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${analysis.executiveSummary}</p>
      ${execSummary && execSummary.keyTakeaways && execSummary.keyTakeaways.length > 0 ? `
      <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12px; color: #475569;">
        ${execSummary.keyTakeaways.map(t => `<li style="margin-bottom: 3px;">${t}</li>`).join('')}
      </ul>
      ` : ''}
    </div>

    <!-- 2. Dates & Obligations Timeline -->
    <h2>2. Important Dates & Operational Obligations Timeline</h2>
    ${timeline.length > 0 ? `
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 25%;">Milestone / Event</th>
          <th style="width: 22%;">Date or Window</th>
          <th style="width: 15%;">Classification</th>
          <th>Operational Description</th>
        </tr>
      </thead>
      <tbody>
        ${timeline.map(ev => `
        <tr>
          <td><strong>${ev.title}</strong><br/><span style="font-size: 10px; color: #64748b;">Ref: ${ev.clauseReference || 'N/A'}</span></td>
          <td style="font-family: monospace; font-weight: 600;">${ev.dateOrPeriod}</td>
          <td>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${
              ev.status === 'critical' ? '#fee2e2; color: #991b1b;' : ev.status === 'milestone' ? '#e0f2fe; color: #0369a1;' : '#f1f5f9; color: #475569;'
            }">
              ${ev.type.toUpperCase()}
            </span>
          </td>
          <td style="font-size: 12px;">${ev.description}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="font-size: 13px; color: #64748b;">No timeline events extracted.</p>'}

    ${obligations.length > 0 ? `
    <h3 style="font-size: 14px; margin: 18px 0 8px 0; color: #0f172a;">Key Contractual Obligations Matrix</h3>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 20%;">Responsible Party</th>
          <th style="width: 15%;">Category</th>
          <th>Obligation Covenant</th>
          <th style="width: 20%;">Cadence / Deadline</th>
        </tr>
      </thead>
      <tbody>
        ${obligations.map(ob => `
        <tr>
          <td style="font-weight: 600;">${ob.party}</td>
          <td><span style="font-size: 11px; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${ob.category}</span></td>
          <td style="font-size: 12px;">${ob.description}</td>
          <td style="font-size: 12px; font-family: monospace;">${ob.deadlineOrFrequency || 'Term'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="page-break"></div>

    <!-- 3. Risk Scoring & Matrix -->
    <h2>3. Deterministic Risk Scoring & Severity Distribution</h2>
    <p style="font-size: 12px; color: #64748b;">
      Risk metrics are computed strictly using the deterministic formula: Raw Score = Severity (1-5) &times; Probability (1-5) &times; Impact (1-5), normalized to a 100-point scale.
    </p>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px 0; text-align: center;">
      <div style="background: #fff1f2; padding: 12px; border-radius: 8px; border: 1px solid #fecdd3;">
        <div style="font-size: 22px; font-weight: bold; color: #e11d48;">${criticalRisks.length}</div>
        <div style="font-size: 12px; font-weight: 600; color: #9f1239;">Critical Risks (76-100)</div>
      </div>
      <div style="background: #fff7ed; padding: 12px; border-radius: 8px; border: 1px solid #ffedd5;">
        <div style="font-size: 22px; font-weight: bold; color: #ea580c;">${highRisks.length}</div>
        <div style="font-size: 12px; font-weight: 600; color: #9a3412;">High Risks (51-75)</div>
      </div>
      <div style="background: #fefce8; padding: 12px; border-radius: 8px; border: 1px solid #fef08a;">
        <div style="font-size: 22px; font-weight: bold; color: #ca8a04;">${modRisks.length}</div>
        <div style="font-size: 12px; font-weight: 600; color: #854d0e;">Moderate Risks (26-50)</div>
      </div>
      <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
        <div style="font-size: 22px; font-weight: bold; color: #16a34a;">${lowRisks.length}</div>
        <div style="font-size: 12px; font-weight: 600; color: #166534;">Low Risks (0-25)</div>
      </div>
    </div>

    <!-- 4. Deep-Dive Risk Findings -->
    <h2>4. Deep-Dive Explainable Risk Findings</h2>
    ${criticalRisks.length > 0 ? `
      <h3 style="color: #e11d48; font-size: 15px; margin-top: 16px;">Critical Risk Findings (Immediate Action Mandatory)</h3>
      ${criticalRisks.map(r => renderRiskCard(r, '#e11d48', '#fee2e2')).join('')}
    ` : ''}

    ${highRisks.length > 0 ? `
      <h3 style="color: #ea580c; font-size: 15px; margin-top: 20px;">High Risk Findings (Active Redline Recommended)</h3>
      ${highRisks.map(r => renderRiskCard(r, '#ea580c', '#ffedd5')).join('')}
    ` : ''}

    ${modRisks.length > 0 ? `
      <h3 style="color: #ca8a04; font-size: 15px; margin-top: 20px;">Moderate Risk Findings (Commercial Review Advised)</h3>
      ${modRisks.map(r => renderRiskCard(r, '#ca8a04', '#fef9c3')).join('')}
    ` : ''}

    ${criticalRisks.length === 0 && highRisks.length === 0 && modRisks.length === 0 ? `
      <p style="color: #16a34a; font-size: 13px; margin: 16px 0;">No high or critical contractual exposures detected. Agreement conforms to balanced covenants.</p>
    ` : ''}

    <div class="page-break"></div>

    <!-- 5. Recommendations & Redline Checklist -->
    <h2>5. Redline Action Plan & Negotiation Checklist</h2>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.8;">
        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <!-- 6. Executive Review Sign-off Block -->
    <h2>6. Counsel Sign-Off & Review Approval</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
      <tr>
        <td style="width: 50%; padding: 20px; border: 1px solid #cbd5e1; border-radius: 6px;">
          <p style="margin: 0 0 35px 0; font-weight: bold; color: #0f172a;">Legal Counsel / Reviewing Attorney:</p>
          <div style="border-bottom: 1px solid #94a3b8; width: 85%; margin-bottom: 6px;"></div>
          <span style="font-size: 11px; color: #64748b;">Signature & Date</span>
        </td>
        <td style="width: 50%; padding: 20px; border: 1px solid #cbd5e1; border-radius: 6px;">
          <p style="margin: 0 0 35px 0; font-weight: bold; color: #0f172a;">Commercial / Executive Sign-Off:</p>
          <div style="border-bottom: 1px solid #94a3b8; width: 85%; margin-bottom: 6px;"></div>
          <span style="font-size: 11px; color: #64748b;">Signature & Date</span>
        </td>
      </tr>
    </table>

    <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center; font-family: monospace;">
      Generated automatically by LexGuard AI Legal Intelligence & Contract Risk Platform &bull; Verifiable Multi-Agent Evidence Grounding
    </div>
  </div>
</body>
</html>
    `;
  }
}
