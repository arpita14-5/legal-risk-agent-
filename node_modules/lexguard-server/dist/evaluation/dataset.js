"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVALUATION_BENCHMARK_DATASET = void 0;
exports.EVALUATION_BENCHMARK_DATASET = [
    {
        id: "bench-1",
        text: "IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES. EACH PARTY AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL BE STRICTLY LIMITED TO THE FEES PAID HEREUNDER IN THE PRIOR 12 MONTHS.",
        expectedCategory: "Liability",
        containsRisk: false
    },
    {
        id: "bench-2",
        text: "Customer agrees that Customer shall bear unlimited liability for any direct, indirect, consequential, incidental, or punitive damages arising out of or related to service usage. There shall be no limitation of liability or cap on Customer obligations.",
        expectedCategory: "Liability",
        expectedRisk: "Financial",
        containsRisk: true
    },
    {
        id: "bench-3",
        text: "Customer shall defend, indemnify and hold harmless Provider and its officers, directors, and agents from any and all claims, damages, liabilities, costs, and expenses arising out of or related in any way to this Agreement, regardless of whether Provider was negligent.",
        expectedCategory: "Indemnification",
        expectedRisk: "Legal",
        containsRisk: true
    },
    {
        id: "bench-4",
        text: "Either party may terminate this Agreement for convenience upon giving at least sixty (60) days prior written notice to the other party.",
        expectedCategory: "Termination",
        containsRisk: false
    },
    {
        id: "bench-5",
        text: "Provider may terminate this agreement at any time without cause and for any reason upon five (5) days written notice. Customer shall have no right to terminate for convenience.",
        expectedCategory: "Termination",
        expectedRisk: "Operational",
        containsRisk: true
    },
    {
        id: "bench-6",
        text: "Upon expiration of the initial term, this Agreement shall automatically renew for successive periods of two (2) years each, unless Customer provides written notice of intent not to renew at least ninety (90) days prior to the expiration of the then-current term.",
        expectedCategory: "Renewal",
        expectedRisk: "Commercial",
        containsRisk: true
    },
    {
        id: "bench-7",
        text: "Recipient agrees to hold Disclosing Party confidential information in strict confidence and not to disclose such information to third parties. These obligations survive for five (5) years after termination.",
        expectedCategory: "Confidentiality",
        containsRisk: false
    },
    {
        id: "bench-8",
        text: "Customer hereby assigns all right, title and interest in and to all inventions, ideas, custom modules, and background technology created, even if pre-existing prior to this Agreement, to Provider as sole and exclusive property.",
        expectedCategory: "Intellectual Property",
        expectedRisk: "Intellectual Property",
        containsRisk: true
    },
    {
        id: "bench-9",
        text: "Customer shall pay all invoices Net 30 days from date of receipt. In the event of a dispute, parties shall negotiate in good faith.",
        expectedCategory: "Payment",
        containsRisk: false
    },
    {
        id: "bench-10",
        text: "During the term and for a period of three (3) years thereafter, Customer and its affiliates shall not engage in any business that competes with Provider within any geographical market where Provider operates.",
        expectedCategory: "Non-compete",
        expectedRisk: "Commercial",
        containsRisk: true
    },
    {
        id: "bench-11",
        text: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law rules.",
        expectedCategory: "Governing Law",
        containsRisk: false
    },
    {
        id: "bench-12",
        text: "Any dispute arising out of or in connection with this contract shall be submitted to the exclusive jurisdiction of the courts of London, England.",
        expectedCategory: "Governing Law",
        expectedRisk: "Legal",
        containsRisk: true
    }
];
