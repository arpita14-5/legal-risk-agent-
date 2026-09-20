"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_RISK_RULES = void 0;
exports.detectContractRisks = detectContractRisks;
const uuid_1 = require("uuid");
exports.LEGAL_RISK_RULES = [
    {
        id: 'unlimited-liability',
        title: 'Unlimited Liability & Absence of Cap',
        category: 'Financial',
        severity: 5,
        probability: 4,
        impact: 5,
        triggerRegex: /unlimited liability|no limitation of liability|shall not be limited to|without limitation as to amount|shall be fully liable for all indirect/i,
        targetClauseCategories: ['Liability', 'Indemnification'],
        description: 'The agreement imposes uncapped or unlimited financial liability for contractual breach, consequential damages, or third-party indemnities.',
        whyItMatters: 'Exposes your organization to catastrophic financial recovery claims far exceeding the total commercial value or total fees paid under the contract.',
        recommendation: 'Negotiate a mutual aggregate liability cap tied to fees paid over the trailing 12 months (or a fixed 1x-2x contract value), and explicitly exclude indirect, special, and consequential damages.',
        detectionReason: 'Identified explicit terms imposing uncapped damages or disclaiming any upper financial limit on contractual liability.',
        suggestedClause: 'Except for gross negligence, willful misconduct, or breaches of Section [Confidentiality], in no event shall either party\'s total aggregate liability arising out of or related to this Agreement exceed the total amounts actually paid or payable by Customer under this Agreement in the twelve (12) months preceding the event giving rise to liability. Neither party shall be liable for any indirect, incidental, consequential, punitive, or special damages.',
        negotiationPoint: 'Commercial contracts must have mutual liability caps commensurate with deal value. Uncapped liability creates uninsurable balance-sheet exposure that is unacceptable under standard corporate risk governance.',
        confidence: 0.96,
        legalSources: [
            {
                id: 'ucc-2-719',
                title: 'UCC § 2-719: Contractual Modification or Limitation of Remedy',
                source: 'Uniform Commercial Code',
                jurisdiction: 'United States',
                section: '§ 2-719',
                contentSnippet: 'Consequential damages may be limited or excluded unless the limitation or exclusion is unconscionable. Limitation of consequential damages for injury to the person in the case of consumer goods is prima facie unconscionable but limitation of damages where the loss is commercial is not.'
            }
        ]
    },
    {
        id: 'missing-liability-cap',
        title: 'Missing Aggregate Liability Cap',
        category: 'Financial',
        severity: 4,
        probability: 4,
        impact: 4,
        triggerRegex: /in no event shall either party's liability be capped|no cap on damages/i,
        targetClauseCategories: ['Liability'],
        description: 'The contract fails to explicitly specify a monetary maximum on aggregate liability damages.',
        whyItMatters: 'Without a clear cap, common law default remedies apply, exposing the company to extensive direct loss claims.',
        recommendation: 'Insert standard language: "Except for breaches of Section X (Confidentiality), each party\'s total aggregate liability arising out of this Agreement shall not exceed the amounts paid or payable under this Agreement during the twelve (12) months preceding the claim."',
        detectionReason: 'Clause states or implies that liability shall not be subject to a monetary ceiling or aggregate maximum.',
        suggestedClause: 'Each party\'s aggregate liability under this Agreement shall be limited to the total fees paid or payable by Customer in the preceding twelve (12) months.',
        negotiationPoint: 'Emphasize that without an explicit aggregate dollar cap, both parties face unpredictable downside risk in the event of minor operational disputes.',
        confidence: 0.94
    },
    {
        id: 'broad-indemnification',
        title: 'Overly Broad Indemnification Exposure',
        category: 'Legal',
        severity: 4,
        probability: 4,
        impact: 4,
        triggerRegex: /defend, indemnify and hold harmless.*?from any and all claims|indemnify.*?arising out of or related in any way/i,
        targetClauseCategories: ['Indemnification'],
        description: 'Requires full defense and indemnification for third-party claims without limiting obligations to gross negligence or willful misconduct.',
        whyItMatters: 'You may be forced to pay legal defense fees and settlements for third-party suits even where you were only minimally or non-negligently involved.',
        recommendation: 'Narrow indemnification obligations strictly to third-party intellectual property infringement claims and gross negligence or intentional misconduct, with clear prompt-notice defense control.',
        detectionReason: 'Identified broad indemnity trigger covering "any and all claims" without standard qualifiers for causation, fault, or negligence.',
        suggestedClause: 'Each party ("Indemnifying Party") shall defend and indemnify the other party from third-party claims, suits, or proceedings only to the extent arising directly from the Indemnifying Party\'s material breach of this Agreement, gross negligence, or willful misconduct, provided that the indemnified party provides prompt written notice and sole defense control.',
        negotiationPoint: 'Indemnity should shift risk only for fault-based occurrences or specific non-insurable hazards (e.g. IP infringement), not ordinary commercial performance issues.',
        confidence: 0.95
    },
    {
        id: 'one-sided-termination',
        title: 'Unilateral Termination for Convenience',
        category: 'Operational',
        severity: 4,
        probability: 3,
        impact: 4,
        triggerRegex: /(?:company|customer|provider|vendor) may terminate this agreement at any time (?:without cause|for any reason)|unilateral right to terminate|customer shall have no right to terminate/i,
        targetClauseCategories: ['Termination'],
        description: 'Only one party possesses the right to terminate the contract at will for convenience, while the other remains bound.',
        whyItMatters: 'Leaves your operations vulnerable to abrupt cancellation after making capital investments or dedicating delivery personnel.',
        recommendation: 'Make termination for convenience mutual with at least 60 days advance written notice and reimbursement for unamortized expenses incurred.',
        detectionReason: 'Identified asymmetric termination rights granting only the counterparty the liberty to exit without cause.',
        suggestedClause: 'Either party may terminate this Agreement for convenience and without cause upon providing at least sixty (60) days\' prior written notice to the other party. Upon such termination, Customer shall pay for all Services satisfactorily rendered through the effective termination date.',
        negotiationPoint: 'Mutuality is a fundamental canon of commercial fairness; if one party holds convenience exit rights, both parties must share an equal notice horizon.',
        confidence: 0.93
    },
    {
        id: 'short-termination-notice',
        title: 'Abrupt Termination Notice Window (< 15 Days)',
        category: 'Operational',
        severity: 4,
        probability: 4,
        impact: 3,
        triggerRegex: /terminate immediately upon|notice of (\d+|ten|five|three|seven)\s*days|within 24 hours of notice/i,
        targetClauseCategories: ['Termination'],
        description: 'The cure period or notice period for contract termination is unusually compressed (less than 15 calendar days).',
        whyItMatters: 'Leaves insufficient runway to identify, investigate, and cure an alleged breach before the counterparty lawfully terminates.',
        recommendation: 'Extend the notice and cure period to a minimum of 30 days for material breaches.',
        detectionReason: 'Identified immediate termination triggers or sub-15-day cure windows for contractual default.',
        suggestedClause: 'Either party may terminate this Agreement if the other party materially breaches any provision hereof and fails to cure such material breach within thirty (30) calendar days after receipt of detailed written notice specifying the nature of the breach.',
        negotiationPoint: 'A 30-day cure period provides reasonable opportunity to remedy operational or billing misunderstandings before invoking contract termination.',
        confidence: 0.95
    },
    {
        id: 'automatic-renewal-trap',
        title: 'Evergreen Automatic Renewal Trap',
        category: 'Commercial',
        severity: 3,
        probability: 5,
        impact: 3,
        triggerRegex: /automatically renew.*?unless (?:either party|customer|provider) provides written notice at least (\d+)\s*days|evergreen renewal/i,
        targetClauseCategories: ['Renewal', 'Term'],
        description: 'The contract automatically locks in for successive 1-year or multi-year terms with an onerous advance opt-out window.',
        whyItMatters: 'Missing the strict opt-out window commits the company to another full billing cycle without negotiation leverage.',
        recommendation: 'Require affirmative written renewal confirmation, or reduce the opt-out notice requirement to 30 days.',
        detectionReason: 'Detected evergreen auto-renewal mechanics combined with advance non-renewal notice requirements.',
        suggestedClause: 'This Agreement shall have an initial term of one (1) year and may be renewed for successive one (1) year periods only upon mutual written agreement of both parties executed at least thirty (30) days prior to the expiration of the then-current term.',
        negotiationPoint: 'Modern procurement and legal best practices discourage automatic lock-in clauses in favor of affirmative annual renewal confirmations.',
        confidence: 0.97
    },
    {
        id: 'excessive-penalties',
        title: 'Excessive Late Payment Penalties & Liquidated Damages',
        category: 'Financial',
        severity: 3,
        probability: 4,
        impact: 3,
        triggerRegex: /interest of (?:2|3|4|5)%\s*per month|late fee of (\d{2,})%|liquidated damages of/i,
        targetClauseCategories: ['Payment'],
        description: 'Interest on late disbursements exceeds standard commercial rates (e.g. 1.5% per month) or imposes penal liquidated damages.',
        whyItMatters: 'Could trigger statutory usury disputes and artificially inflate invoices during bona fide billing discrepancies.',
        recommendation: 'Cap late interest to the lesser of 1.0% per month or the maximum rate permissible by applicable law, with a 15-day grace period.',
        detectionReason: 'Identified late payment finance charges exceeding standard commercial norms (> 1.5% per month) or punitive liquidated damages.',
        suggestedClause: 'Undisputed invoices not paid within Net 30 days shall accrue interest at the rate of one percent (1.0%) per month or the highest rate permitted by applicable law, whichever is lower, following written reminder notice and a ten (10) day grace period.',
        negotiationPoint: 'Finance charges should compensate for time value of money, not act as a penal windfall during good-faith invoicing questions.',
        confidence: 0.92
    },
    {
        id: 'broad-ip-assignment',
        title: 'Broad Intellectual Property Assignment & Loss of Background IP',
        category: 'Intellectual Property',
        severity: 5,
        probability: 3,
        impact: 5,
        triggerRegex: /assigns all right, title and interest in and to all inventions|hereby assigns all pre-existing|all works created shall be sole property/i,
        targetClauseCategories: ['Intellectual Property'],
        description: 'Clause sweeps pre-existing proprietary tools, background technology, and trade secrets into counterparty ownership.',
        whyItMatters: 'Could forfeit ownership over your core software algorithms, libraries, or methodologies developed independently.',
        recommendation: 'Explicitly reserve pre-existing Background IP and grant the counterparty only a non-exclusive, perpetual license for deliverables.',
        detectionReason: 'Language assigns broad title and inventions without carves-outs for pre-existing Background Intellectual Property.',
        suggestedClause: 'Each party retains all right, title, and interest in and to its pre-existing intellectual property and proprietary tools ("Background IP"). Customer receives a perpetual, non-exclusive, royalty-free license to use Background IP embedded in custom Deliverables solely for its internal business operations.',
        negotiationPoint: 'Service providers cannot surrender title to preexisting tools or reusable frameworks; client receives full perpetual usage rights without transferring root IP.',
        confidence: 0.96
    },
    {
        id: 'non-compete-restriction',
        title: 'Broad Post-Termination Non-Compete Restriction',
        category: 'Commercial',
        severity: 4,
        probability: 3,
        impact: 4,
        triggerRegex: /shall not engage in any business that competes|non-compete.*?period of (?:1|2|3|4|5) years|within any geographical market/i,
        targetClauseCategories: ['Non-compete'],
        description: 'Restrictive covenant preventing the company or personnel from engaging in competitive business lines across broad regions.',
        whyItMatters: 'Chokes business growth, restricts future client engagements, and may face enforcement issues under evolving antitrust and FTC regulations.',
        recommendation: 'Strike non-compete clauses entirely in standard commercial contracts, replacing them with narrow non-solicitation of clients.',
        detectionReason: 'Identified post-term covenant not to compete restricting commercial engagements across wide industries or territories.',
        suggestedClause: 'Neither party shall be subject to post-termination non-competition restraints. Each party agrees only that during the term of this Agreement and for twelve (12) months thereafter, neither party will intentionally solicit for employment the key staff of the other party directly involved in the Services without prior written consent.',
        negotiationPoint: 'Commercial non-competes are rarely standard in non-M&A transactions and stifle business expansion; non-solicitation provides adequate mutual protection.',
        confidence: 0.94
    },
    {
        id: 'data-privacy-gap',
        title: 'Inadequate Data Protection & Privacy Compliance',
        category: 'Privacy',
        severity: 4,
        probability: 4,
        impact: 4,
        triggerRegex: /no obligation to comply with gdpr|not responsible for data security|data processing without warranty/i,
        targetClauseCategories: ['Data Protection', 'Privacy'],
        description: 'Contract lacks standard Data Protection Addendum (DPA) commitments, GDPR standard contractual clauses, or breach notifications.',
        whyItMatters: 'May violate GDPR Article 28 and state privacy statutes, risking heavy regulatory fines for unlawful data processing.',
        recommendation: 'Incorporate a dedicated Data Processing Agreement (DPA) covering audit rights, encryption standards, and 48-hour breach notification.',
        detectionReason: 'Detected explicit disclaimer of data protection obligations or absence of mandatory statutory privacy safeguards.',
        suggestedClause: 'Provider shall implement and maintain industry-standard administrative, physical, and technical safeguards designed to protect personal data. In the event of a confirmed Security Incident involving Customer Personal Data, Provider shall notify Customer in writing within forty-eight (48) hours and take reasonable remedial steps.',
        negotiationPoint: 'Modern regulatory compliance (GDPR, CCPA) mandates contractual data processing addenda with explicit security controls and incident reporting.',
        confidence: 0.95,
        legalSources: [
            {
                id: 'gdpr-art-28',
                title: 'GDPR Article 28: Processor Obligations',
                source: 'EU General Data Protection Regulation',
                jurisdiction: 'European Union',
                section: 'Article 28(3)',
                contentSnippet: 'Processing by a processor shall be governed by a contract or other legal act under Union or Member State law, that is binding on the processor with regard to the controller and that sets out the subject-matter and duration of the processing.'
            }
        ]
    },
    {
        id: 'unfavorable-jurisdiction',
        title: 'Distant or Unfavorable Legal Jurisdiction',
        category: 'Legal',
        severity: 3,
        probability: 3,
        impact: 3,
        triggerRegex: /exclusive jurisdiction of the courts of (singapore|london|hong kong|switzerland|england and wales|delaware)/i,
        targetClauseCategories: ['Governing Law', 'Dispute Resolution'],
        description: 'Mandates dispute resolution in a distant foreign jurisdiction or international venue.',
        whyItMatters: 'Significantly raises legal defense expenses, requiring foreign retaining counsel and travel for dispute hearings.',
        recommendation: 'Negotiate neutral domestic jurisdiction or mutual arbitration under American Arbitration Association (AAA) commercial rules.',
        detectionReason: 'Designation of distant or foreign judicial forum for disputes.',
        suggestedClause: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles. Any dispute arising under this Agreement shall be resolved through confidential binding arbitration in New York, NY under the commercial rules of the American Arbitration Association.',
        negotiationPoint: 'Disputes should be adjudicated in a mutually accessible forum with established commercial case law, or through neutral commercial arbitration.',
        confidence: 0.91
    },
    {
        id: 'one-sided-modification',
        title: 'Unilateral Modification Rights',
        category: 'Legal',
        severity: 4,
        probability: 3,
        impact: 4,
        triggerRegex: /reserves the right to modify this agreement at any time|terms may be updated without notice|unilateral discretion to alter/i,
        targetClauseCategories: ['Miscellaneous'],
        description: 'Permits one party to unilaterally alter terms, pricing, or service scope by simply posting updates online.',
        whyItMatters: 'Destabilizes the contractual bargain, allowing adverse price hikes or reduced commitments without mutual agreement.',
        recommendation: 'Require that all amendments or modifications be executed in writing signed by authorized representatives of both parties.',
        detectionReason: 'Identified reservation of rights to alter contract covenants without bilateral written amendment.',
        suggestedClause: 'No amendment, modification, or waiver of any provision of this Agreement shall be effective unless in writing and signed by duly authorized representatives of both parties.',
        negotiationPoint: 'Bilateral commercial contracts cannot be subject to unilateral alteration; any change in commitments or pricing requires executed written consent.',
        confidence: 0.96
    }
];
function detectContractRisks(clauses, fullText, contractId) {
    const findings = [];
    const lowerFull = fullText.toLowerCase();
    for (const rule of exports.LEGAL_RISK_RULES) {
        let matched = false;
        let evidenceText = '';
        let evidencePage = 1;
        let evidenceSection = 'General';
        let matchedClauseTitle = rule.title;
        // 1. Search in matching clauses
        for (const clause of clauses) {
            if (!rule.targetClauseCategories || rule.targetClauseCategories.includes(clause.clauseType)) {
                if (rule.triggerRegex.test(clause.text)) {
                    matched = true;
                    evidenceText = clause.text.slice(0, 350);
                    evidencePage = clause.pageNumber;
                    evidenceSection = clause.clauseNumber || clause.title || `Clause (${clause.clauseType})`;
                    matchedClauseTitle = clause.title || `${clause.clauseType} Clause`;
                    break;
                }
            }
        }
        // 2. Fallback full text match
        if (!matched && rule.triggerRegex.test(lowerFull)) {
            matched = true;
            const match = fullText.match(rule.triggerRegex);
            if (match && match.index !== undefined) {
                const start = Math.max(0, match.index - 50);
                evidenceText = fullText.slice(start, start + 350);
                evidencePage = 1;
                evidenceSection = 'Body Section';
            }
        }
        if (matched) {
            // Deterministic scoring formula: Severity * Probability * Impact (strictly preserved)
            const rawScore = rule.severity * rule.probability * rule.impact; // 1 to 125
            const normalizedScore = Math.min(100, Math.round((rawScore / 125) * 100));
            let level = 'Low';
            if (normalizedScore >= 76)
                level = 'Critical';
            else if (normalizedScore >= 51)
                level = 'High';
            else if (normalizedScore >= 26)
                level = 'Moderate';
            findings.push({
                id: (0, uuid_1.v4)(),
                contractId,
                title: rule.title,
                category: rule.category,
                severity: rule.severity,
                probability: rule.probability,
                impact: rule.impact,
                score: normalizedScore,
                level,
                description: rule.description,
                whyItMatters: rule.whyItMatters,
                recommendation: rule.recommendation,
                detectionReason: rule.detectionReason,
                clauseTitle: matchedClauseTitle,
                confidence: rule.confidence || 0.95,
                suggestedClause: rule.suggestedClause,
                negotiationPoint: rule.negotiationPoint,
                contractEvidence: {
                    page: evidencePage,
                    section: evidenceSection,
                    text: evidenceText
                },
                legalSources: rule.legalSources || [],
                verified: true
            });
        }
    }
    return findings;
}
