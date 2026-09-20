"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAgent = void 0;
class ContractAgent {
    name = 'Contract Analysis Agent';
    async analyzeObligations(clauses, metadata) {
        const obligations = [];
        const paymentClause = clauses.find(c => c.clauseType === 'Payment');
        if (paymentClause) {
            obligations.push(`Financial: Fees are payable according to agreed schedule ${metadata.paymentSchedule || 'within 30 days of invoice receipt'}.`);
        }
        const confClause = clauses.find(c => c.clauseType === 'Confidentiality');
        if (confClause) {
            obligations.push(`Confidentiality: Recipient must maintain proprietary disclosures in strict confidence ${metadata.confidentialityPeriod ? `for ${metadata.confidentialityPeriod}` : 'during and post-term'}.`);
        }
        const ipClause = clauses.find(c => c.clauseType === 'Intellectual Property');
        if (ipClause) {
            obligations.push(`Intellectual Property: Deliverables and licenses governed by ${metadata.ipOwnership || 'mutual commercial terms'}.`);
        }
        const termClause = clauses.find(c => c.clauseType === 'Termination');
        if (termClause) {
            obligations.push(`Termination: Termination notices require ${metadata.noticePeriod || 'written notice'} prior to effective termination.`);
        }
        const partiesStr = metadata.parties.length > 0 ? metadata.parties.join(' and ') : 'the executing parties';
        const summary = `This legal agreement between ${partiesStr} sets forth binding covenants regarding service scope, intellectual property licensing, confidentiality protections, and indemnification standards.`;
        return { summary, keyObligations: obligations };
    }
}
exports.ContractAgent = ContractAgent;
