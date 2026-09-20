"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyClauseText = classifyClauseText;
const CLAUSE_RULES = [
    {
        category: 'Liability',
        titlePattern: /liabilit(y|ies)|damages|limitation of liability/i,
        keywords: ['aggregate liability', 'consequential damages', 'punitive damages', 'indirect damages', 'limitation of liability', 'maximum liability', 'in no event shall', 'exceed the amount paid'],
        weight: 1.2
    },
    {
        category: 'Indemnification',
        titlePattern: /indemnif(y|ication)|hold harmless|defense/i,
        keywords: ['defend, indemnify', 'hold harmless', 'third-party claims', 'losses, damages, liabilities', 'indemnified party'],
        weight: 1.2
    },
    {
        category: 'Termination',
        titlePattern: /terminat(ion|e)|cancellation/i,
        keywords: ['terminate this agreement', 'written notice of termination', 'material breach', 'cure period', 'termination for convenience', 'immediate termination'],
        weight: 1.1
    },
    {
        category: 'Renewal',
        titlePattern: /renew(al|ed)|extension|term/i,
        keywords: ['automatically renew', 'successive periods', 'renewal term', 'written notice not to renew', 'opt-out window', 'evergreen'],
        weight: 1.1
    },
    {
        category: 'Term',
        titlePattern: /term( of agreement)?|duration|period/i,
        keywords: ['effective date', 'initial term', 'shall commence on', 'shall continue for a period of', 'expiration date'],
        weight: 1.0
    },
    {
        category: 'Confidentiality',
        titlePattern: /confidential(ity)?|non-disclosure|proprietary information/i,
        keywords: ['confidential information', 'recipient shall not disclose', 'trade secrets', 'proprietary nature', 'duty of confidentiality', 'return or destroy'],
        weight: 1.1
    },
    {
        category: 'Intellectual Property',
        titlePattern: /intellectual property|ip rights|ownership|patent|copyright/i,
        keywords: ['work made for hire', 'all right, title and interest', 'sole and exclusive property', 'ownership of deliverables', 'proprietary rights', 'license grant'],
        weight: 1.1
    },
    {
        category: 'Payment',
        titlePattern: /payment|fees|invoicing|compensation|billing/i,
        keywords: ['net 30', 'net 60', 'invoices', 'payable within', 'interest rate of', 'late payment fee', 'taxes and duties', 'wire transfer'],
        weight: 1.0
    },
    {
        category: 'Data Protection',
        titlePattern: /data (protection|security|privacy)|gdpr|security measures/i,
        keywords: ['personal data', 'data controller', 'data processor', 'gdpr', 'ccpa', 'data breach notification', 'technical and organizational measures'],
        weight: 1.1
    },
    {
        category: 'Privacy',
        titlePattern: /privacy|confidential consumer data/i,
        keywords: ['personally identifiable information', 'pii', 'privacy policy', 'consumer privacy'],
        weight: 1.0
    },
    {
        category: 'Non-compete',
        titlePattern: /non-compete|covenant not to compete|restraint of trade/i,
        keywords: ['shall not engage in', 'competitive business', 'restricted period', 'restricted territory', 'competing services'],
        weight: 1.2
    },
    {
        category: 'Non-solicitation',
        titlePattern: /non-solicit(ation)?/i,
        keywords: ['solicit or entice', 'solicitation of employees', 'solicitation of customers', 'directly or indirectly hire'],
        weight: 1.1
    },
    {
        category: 'Dispute Resolution',
        titlePattern: /dispute( resolution)?|arbitration|mediation/i,
        keywords: ['binding arbitration', 'american arbitration association', 'aaa rules', 'jams', 'informal dispute resolution', 'escalation'],
        weight: 1.0
    },
    {
        category: 'Governing Law',
        titlePattern: /governing law|jurisdiction|applicable law/i,
        keywords: ['governed by the laws of', 'governed by and construed in accordance with', 'exclusive jurisdiction', 'courts of', 'without regard to conflict of laws'],
        weight: 1.0
    },
    {
        category: 'Warranties',
        titlePattern: /warrant(y|ies)|guarantee/i,
        keywords: ['warrants and represents', 'as is', 'merchantability', 'fitness for a particular purpose', 'express or implied warranties'],
        weight: 1.0
    },
    {
        category: 'Representations',
        titlePattern: /representation(s)?/i,
        keywords: ['duly organized', 'full power and authority', 'not in violation of', 'valid and binding obligation'],
        weight: 1.0
    },
    {
        category: 'Force Majeure',
        titlePattern: /force majeure|act of god/i,
        keywords: ['acts of god', 'natural disasters', 'acts of war', 'pandemic', 'beyond reasonable control', 'suspension of performance'],
        weight: 1.0
    },
    {
        category: 'Assignment',
        titlePattern: /assignment|delegation/i,
        keywords: ['may not assign', 'written consent of the other party', 'successors and permitted assigns', 'change of control'],
        weight: 1.0
    },
    {
        category: 'Audit',
        titlePattern: /audit( rights)?|inspection|books and records/i,
        keywords: ['right to audit', 'books and records', 'normal business hours', 'independent auditor', 'inspection of facilities'],
        weight: 1.0
    },
    {
        category: 'Insurance',
        titlePattern: /insurance|coverage/i,
        keywords: ['commercial general liability', 'errors and omissions', 'cyber insurance', 'policy limits of at least', 'certificate of insurance'],
        weight: 1.0
    },
    {
        category: 'Definitions',
        titlePattern: /definition(s)?/i,
        keywords: ['shall have the meanings set forth', 'as used in this agreement', 'hereinafter referred to as'],
        weight: 1.0
    },
    {
        category: 'Parties',
        titlePattern: /parties|preamble|recitals/i,
        keywords: ['by and between', 'entered into as of', 'referred to individually as', 'witnesseth'],
        weight: 1.0
    }
];
function classifyClauseText(text, titleHint) {
    let bestCategory = 'Miscellaneous';
    let maxScore = 0;
    const lowerText = text.toLowerCase();
    const lowerTitle = (titleHint || '').toLowerCase();
    for (const rule of CLAUSE_RULES) {
        let score = 0;
        if (titleHint && rule.titlePattern.test(lowerTitle)) {
            score += 4.0 * rule.weight;
        }
        for (const kw of rule.keywords) {
            if (lowerText.includes(kw)) {
                score += 1.5 * rule.weight;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            bestCategory = rule.category;
        }
    }
    // Calculate confidence (capped at 0.98)
    const confidence = maxScore >= 4 ? 0.95 : maxScore >= 2 ? 0.85 : maxScore > 0 ? 0.70 : 0.50;
    // Favorability heuristic
    let favorableTo = 'mutual';
    if (lowerText.includes('sole discretion') || lowerText.includes('without liability') || lowerText.includes('unilateral')) {
        favorableTo = 'counterparty';
    }
    else if (lowerText.includes('unlimited liability') || lowerText.includes('perpetual non-compete')) {
        favorableTo = 'unfavorable_to_all';
    }
    else if (lowerText.includes('each party') || lowerText.includes('mutually agreed') || lowerText.includes('both parties')) {
        favorableTo = 'mutual';
    }
    return { category: bestCategory, confidence, favorableTo };
}
