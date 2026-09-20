import { v4 as uuidv4 } from 'uuid';
import type {
  StructuredContractMetadata,
  ContractTimelineEvent,
  ContractObligation,
  ContractExecutiveSummary,
  RiskFinding,
  Clause
} from '../types/shared.js';

export function extractContractMetadata(fullText: string): StructuredContractMetadata {
  const metadata: StructuredContractMetadata = {
    parties: []
  };

  // Parties detection
  const partyMatch = fullText.match(/(?:by and between|between)\s+([A-Z0-9\s,\.\(\)]+?)(?:,\s*a\s+[a-zA-Z\s]+)?\s+(?:and|\&)\s+([A-Z0-9\s,\.\(\)]+?)(?:,\s*a\s+[a-zA-Z\s]+)?(?:\s*\(each|\.|\n)/i);
  if (partyMatch) {
    const p1 = partyMatch[1].trim().replace(/^["']|["']$/g, '');
    const p2 = partyMatch[2].trim().replace(/^["']|["']$/g, '');
    if (p1.length > 2 && p1.length < 100) metadata.parties.push(p1);
    if (p2.length > 2 && p2.length < 100) metadata.parties.push(p2);
  } else {
    // Fallback party search
    const lines = fullText.split('\n').slice(0, 20);
    for (const line of lines) {
      if (line.includes('Inc.') || line.includes('LLC') || line.includes('Corp') || line.includes('Ltd')) {
        const clean = line.trim().slice(0, 60);
        if (!metadata.parties.includes(clean)) metadata.parties.push(clean);
      }
    }
  }

  // Effective Date
  const dateMatch = fullText.match(/(?:effective as of|dated as of|made and entered into this|entered into as of)\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+day of\s+[A-Za-z]+,\s*\d{4})/i);
  if (dateMatch) {
    metadata.effectiveDate = dateMatch[1].trim();
  }

  // Expiration / Term Duration
  const termMatch = fullText.match(/(?:initial term of|term shall commence.*?and continue for a period of|shall remain in effect for)\s+([^\.,;\n]+)/i);
  if (termMatch) {
    metadata.contractDuration = termMatch[1].trim();
  } else if (/one \(1\) year|1 year|twelve \(12\) months/i.test(fullText)) {
    metadata.contractDuration = '1 Year Initial Term';
  }

  // Governing Law & Jurisdiction
  const govLawMatch = fullText.match(/governed by.*?laws of (?:the (?:State|Commonwealth) of\s+)?([A-Za-z\s]+?)(?:,|\.|\s+without)/i);
  if (govLawMatch) {
    metadata.governingLaw = govLawMatch[1].trim();
  }
  const jurisMatch = fullText.match(/exclusive jurisdiction of the (?:state and federal )?courts (?:located in|of)\s+([A-Za-z\s,]+?)(?:\.|\;|\n)/i);
  if (jurisMatch) {
    metadata.jurisdiction = jurisMatch[1].trim();
  }

  // Termination Notice Period
  const noticeMatch = fullText.match(/(?:upon|providing|give)\s+(?:at least\s+)?(\d+\s*(?:days'|days|months)?)\s*(?:prior\s*)?written notice/i);
  if (noticeMatch) {
    metadata.noticePeriod = noticeMatch[1].trim();
  }

  // Liability Cap
  const capMatch = fullText.match(/(?:aggregate liability.*?shall not exceed|limited to)\s+([^;\.\n]+)/i);
  if (capMatch) {
    metadata.liabilityCap = capMatch[1].trim();
  } else if (/unlimited liability/i.test(fullText)) {
    metadata.liabilityCap = 'Uncapped / Unlimited Liability';
  }

  // Renewal terms
  const renewMatch = fullText.match(/(?:automatically renew.*?for successive periods of\s+([^;\.\n]+))/i);
  if (renewMatch) {
    metadata.renewalPeriod = renewMatch[1].trim();
  } else if (/automatically renew/i.test(fullText)) {
    metadata.renewalPeriod = 'Automatic Renewal (Evergreen)';
  }

  // Payment terms
  const payMatch = fullText.match(/(?:invoiced|payable|due)\s+(?:within|net)\s+(\d+\s*days|net\s*\d+)/i);
  if (payMatch) {
    metadata.paymentSchedule = payMatch[1].trim();
  }

  // IP Ownership
  if (/work made for hire/i.test(fullText)) {
    metadata.ipOwnership = 'Work Made for Hire (Customer Owned)';
  } else if (/sole and exclusive property of (?:company|vendor|provider)/i.test(fullText)) {
    metadata.ipOwnership = 'Vendor Proprietary / Retained Ownership';
  } else {
    metadata.ipOwnership = 'Standard License Grant / Mutual IP';
  }

  // Confidentiality Period
  const confMatch = fullText.match(/(?:confidentiality obligations.*?shall survive for a period of|remain in effect for)\s+([^;\.\n]+)/i);
  if (confMatch) {
    metadata.confidentialityPeriod = confMatch[1].trim();
  } else if (/survive indefinitely|perpetual confidentiality/i.test(fullText)) {
    metadata.confidentialityPeriod = 'Indefinite / Perpetual';
  }

  return metadata;
}

export function extractContractTimeline(
  fullText: string,
  clauses: Clause[],
  metadata: StructuredContractMetadata
): ContractTimelineEvent[] {
  const events: ContractTimelineEvent[] = [];

  // 1. Inception / Effective Date
  events.push({
    id: uuidv4(),
    title: 'Agreement Execution & Effective Date',
    dateOrPeriod: metadata.effectiveDate || 'Execution Date',
    type: 'effective',
    description: 'Contract covenants and representations become legally binding on all signatories.',
    status: 'milestone',
    clauseReference: 'Preamble / Section 1'
  });

  // 2. Payment Invoicing Schedule
  const payClause = clauses.find(c => c.clauseType === 'Payment');
  events.push({
    id: uuidv4(),
    title: 'Payment & Invoicing Cycles',
    dateOrPeriod: metadata.paymentSchedule || 'Net 30 Days',
    type: 'payment',
    description: 'Recurring billing cycles, invoice submission, and disbursement deadlines.',
    status: 'recurring',
    clauseReference: payClause?.clauseNumber || 'Payment Section'
  });

  // 3. Renewal Opt-out Notice Window
  const renewalClause = clauses.find(c => c.clauseType === 'Renewal');
  const noticeMatch = (renewalClause?.text || fullText).match(/(\d+)\s*days\s*prior/i);
  const renewalNoticeDays = noticeMatch ? `${noticeMatch[1]} Days Prior to Expiry` : '30-60 Days Prior to Expiry';

  events.push({
    id: uuidv4(),
    title: 'Renewal Opt-Out Notice Window',
    dateOrPeriod: renewalNoticeDays,
    type: 'renewal',
    description: metadata.renewalPeriod
      ? `Deadline to submit written opt-out notice to prevent auto-renewal (${metadata.renewalPeriod}).`
      : 'Deadline for mutual affirmative renewal election.',
    status: 'critical',
    clauseReference: renewalClause?.clauseNumber || 'Term & Renewal Section'
  });

  // 4. Expiration / Initial Term Horizon
  events.push({
    id: uuidv4(),
    title: 'Initial Contract Term Expiration',
    dateOrPeriod: metadata.expirationDate || metadata.contractDuration || 'End of Initial Term',
    type: 'expiry',
    description: 'Completion of initial contractual period and milestone review.',
    status: 'milestone',
    clauseReference: 'Term & Termination'
  });

  // 5. Termination Notice & Cure Window
  const termClause = clauses.find(c => c.clauseType === 'Termination');
  events.push({
    id: uuidv4(),
    title: 'Breach Notice & Cure Period',
    dateOrPeriod: metadata.noticePeriod ? `${metadata.noticePeriod} Notice Period` : '30 Calendar Days',
    type: 'notice',
    description: 'Mandatory window required to investigate and remedy alleged material breaches before formal termination.',
    status: 'critical',
    clauseReference: termClause?.clauseNumber || 'Termination Clause'
  });

  // 6. Post-Term Confidentiality Survival
  const confClause = clauses.find(c => c.clauseType === 'Confidentiality');
  events.push({
    id: uuidv4(),
    title: 'Confidentiality Survival Period',
    dateOrPeriod: metadata.confidentialityPeriod || '3 - 5 Years Post-Termination',
    type: 'milestone',
    description: 'Trade secret and non-disclosure obligations remain strictly enforceable after contract conclusion.',
    status: 'milestone',
    clauseReference: confClause?.clauseNumber || 'Confidentiality Section'
  });

  return events;
}

export function extractContractObligations(
  fullText: string,
  clauses: Clause[],
  metadata: StructuredContractMetadata
): ContractObligation[] {
  const obligations: ContractObligation[] = [];
  const p1 = metadata.parties[0] || 'Customer / Receiving Party';
  const p2 = metadata.parties[1] || 'Provider / Disclosing Party';

  // 1. Payment Obligation
  obligations.push({
    id: uuidv4(),
    party: p1,
    description: `Disburse undisputed invoices within ${metadata.paymentSchedule || 'Net 30 days'} of receipt.`,
    category: 'Payment',
    deadlineOrFrequency: metadata.paymentSchedule || 'Net 30 Days',
    clauseReference: 'Payment Terms'
  });

  // 2. Service Delivery & Standard of Care
  obligations.push({
    id: uuidv4(),
    party: p2,
    description: 'Perform services with professional diligence, conforming to industry best practices and agreed deliverables.',
    category: 'Delivery',
    deadlineOrFrequency: 'Continuous during active Term',
    clauseReference: 'Scope of Work & Warranties'
  });

  // 3. Confidentiality
  obligations.push({
    id: uuidv4(),
    party: 'Both Parties (Mutual)',
    description: `Protect non-public proprietary information, applying at least reasonable care. Survives ${metadata.confidentialityPeriod || '3-5 years'}.`,
    category: 'Confidentiality',
    deadlineOrFrequency: metadata.confidentialityPeriod || 'Post-Termination',
    clauseReference: 'Confidentiality & Non-Disclosure'
  });

  // 4. Data Protection & Privacy Compliance
  if (/data protection|gdpr|personal data|security/i.test(fullText)) {
    obligations.push({
      id: uuidv4(),
      party: p2,
      description: 'Implement administrative and technical safeguards to secure personal data and report breaches within 48-72 hours.',
      category: 'Compliance',
      deadlineOrFrequency: 'Within 48-72 hours of incident',
      clauseReference: 'Data Protection & Security'
    });
  }

  // 5. Intellectual Property Rights
  obligations.push({
    id: uuidv4(),
    party: 'Both Parties (Mutual)',
    description: `Adhere to ownership model: ${metadata.ipOwnership || 'License grant with pre-existing Background IP reserved'}.`,
    category: 'General',
    deadlineOrFrequency: 'Perpetual',
    clauseReference: 'Intellectual Property Allocation'
  });

  // 6. Audit & Books Inspection
  if (/audit|inspection|books and records/i.test(fullText)) {
    obligations.push({
      id: uuidv4(),
      party: p2,
      description: 'Permit access to relevant billing records during normal business hours upon reasonable advance written notice.',
      category: 'Audit',
      deadlineOrFrequency: 'Annual / Reasonable Notice',
      clauseReference: 'Audit & Records Inspection'
    });
  }

  return obligations;
}

export function generateExecutiveSummaryData(
  contractType: string,
  metadata: StructuredContractMetadata,
  risks: RiskFinding[]
): ContractExecutiveSummary {
  const topRisks = [...risks]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      title: r.title,
      level: r.level,
      score: r.score,
      category: r.category
    }));

  const keyTakeaways: string[] = [];
  if (risks.some(r => r.level === 'Critical')) {
    keyTakeaways.push('Critical liability or operational exposures detected requiring mandatory counsel sign-off before execution.');
  }
  if (metadata.liabilityCap?.toLowerCase().includes('uncapped') || metadata.liabilityCap?.toLowerCase().includes('unlimited')) {
    keyTakeaways.push('Contract features uncapped liability exposure; negotiate an aggregate 12-month trailing fees limitation.');
  }
  if (metadata.renewalPeriod?.toLowerCase().includes('auto') || metadata.renewalPeriod?.toLowerCase().includes('evergreen')) {
    keyTakeaways.push('Contains automatic renewal lock-in; calendar the advance opt-out notice deadline.');
  }
  if (keyTakeaways.length === 0) {
    keyTakeaways.push('Standard commercial covenants identified with balanced mutual protections.');
  }

  return {
    contractType,
    parties: metadata.parties.length > 0 ? metadata.parties : ['Customer', 'Provider'],
    effectiveDate: metadata.effectiveDate || 'Upon execution',
    expirationDate: metadata.expirationDate || metadata.contractDuration || '1 Year from Effective Date',
    termDuration: metadata.contractDuration || '12 Months',
    renewalTerms: metadata.renewalPeriod || 'Mutual written agreement',
    terminationTerms: metadata.noticePeriod ? `${metadata.noticePeriod} prior notice for material breach` : '30 days standard notice',
    paymentTerms: metadata.paymentSchedule || 'Net 30 Days',
    ipTerms: metadata.ipOwnership || 'Standard mutual license',
    liabilityCapTerms: metadata.liabilityCap || 'Subject to statutory common law limits',
    governingLaw: metadata.governingLaw || 'Standard commercial jurisdiction',
    topRisks,
    keyTakeaways
  };
}
