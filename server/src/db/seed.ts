import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getRepository } from './repository.js';
import { DocumentProcessor } from '../services/documentProcessor.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { config } from '../config/env.js';

export async function seedInitialData() {
  const repo = await getRepository();
  const processor = new DocumentProcessor();
  const orchestrator = new AgentOrchestrator();

  // 1. Seed Default Users if none exist
  let demoUser = await repo.findUserByEmail('counsel@lexguard.ai');
  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    // Normal Counsel User
    await repo.createUser({
      email: 'counsel@lexguard.ai',
      name: 'Elena Vance, Esq.',
      passwordHash: hash,
      role: 'user'
    });

    // Admin User
    await repo.createUser({
      email: 'admin@lexguard.ai',
      name: 'Marcus Sterling (Chief Legal Officer)',
      passwordHash: hash,
      role: 'admin'
    });

    demoUser = await repo.findUserByEmail('counsel@lexguard.ai');
    console.log('✓ Demo users seeded: counsel@lexguard.ai and admin@lexguard.ai (pwd: password123)');
  }

  // 2. Seed Legal Sources if none exist
  const existingSources = await repo.getLegalSources();
  if (existingSources.length === 0) {
    const defaultSources = [
      {
        title: 'UCC § 2-719: Contractual Modification or Limitation of Remedy',
        source: 'Uniform Commercial Code',
        jurisdiction: 'United States',
        section: '§ 2-719',
        content: 'Consequential damages may be limited or excluded unless the limitation or exclusion is unconscionable. Limitation of consequential damages for injury to the person in the case of consumer goods is prima facie unconscionable but limitation of damages where the loss is commercial is not.'
      },
      {
        title: 'GDPR Article 28: Processor & Data Controller Obligations',
        source: 'EU General Data Protection Regulation',
        jurisdiction: 'European Union',
        section: 'Article 28(3)',
        content: 'Processing by a processor shall be governed by a contract or other legal act under Union or Member State law, that is binding on the processor with regard to the controller and that sets out the subject-matter and duration of the processing, the nature and purpose of the processing, the type of personal data and categories of data subjects.'
      },
      {
        title: 'Delaware General Corporation Law § 145: Indemnification of Officers & Directors',
        source: 'Delaware Code Title 8',
        jurisdiction: 'Delaware, USA',
        section: '§ 145',
        content: 'A corporation shall have power to indemnify any person who was or is a party or is threatened to be made a party to any threatened, pending or completed action, suit or proceeding, whether civil, criminal, administrative or investigative by reason of the fact that the person is or was a director or officer.'
      },
      {
        title: 'California Business & Professions Code § 16600: Void Non-Compete Covenants',
        source: 'California State Code',
        jurisdiction: 'California, USA',
        section: '§ 16600',
        content: 'Except as provided in this chapter, every contract by which anyone is restrained from engaging in a lawful profession, trade, or business of any kind is to that extent void. Recent amendments prohibit employers from enforcing non-competes regardless of where signed.'
      },
      {
        title: 'Defend Trade Secrets Act (DTSA) 18 U.S.C. § 1836',
        source: 'United States Code',
        jurisdiction: 'Federal, USA',
        section: '18 U.S.C. § 1836',
        content: 'An owner of a trade secret that is misappropriated may bring a civil action under this subsection if the trade secret is related to a product or service used in, or intended for use in, interstate or foreign commerce. Provides statutory remedies and ex parte seizure orders.'
      }
    ];

    for (const s of defaultSources) {
      await repo.addLegalSource({
        ...s,
        contentSnippet: s.content.slice(0, 250)
      });
    }
    console.log('✓ Authoritative legal knowledge sources seeded.');
  }

  // 3. Seed Realistic Demo Contracts if none exist
  const existingContracts = await repo.listContracts(demoUser!.id);
  if (existingContracts.length === 0) {
    const contractsToSeed = [
      {
        title: 'Master Services Agreement - CloudTech Enterprise',
        type: 'Master Services Agreement',
        fileName: 'Master_Services_Agreement_CloudTech.docx',
        text: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of January 15, 2025 ("Effective Date") by and between CloudTech Solutions Inc., a Delaware corporation ("Provider"), and Acme Global Logistics LLC ("Customer").

SECTION 1: TERM AND DURATION
This Agreement shall commence on the Effective Date and shall continue for an initial term of three (3) years.

SECTION 2: AUTOMATIC RENEWAL TRAP
Upon the expiration of the initial term, this Agreement shall automatically renew for successive periods of two (2) years each, unless Customer provides written notice of intent not to renew at least ninety (90) days prior to the expiration of the then-current term.

SECTION 3: PAYMENT TERMS AND PENALTIES
Customer shall pay all invoices Net 15 days. Unpaid invoices shall accrue interest of 3% per month or the highest lawful rate. Customer shall pay liquidated damages of $10,000 for any billing dispute resolved in Provider's favor.

SECTION 4: INTELLECTUAL PROPERTY AND ASSIGNMENT
Provider and Customer agree that Customer hereby assigns all right, title and interest in and to all inventions, ideas, custom modules, and background technology created, even if pre-existing prior to this Agreement, to Provider as sole and exclusive property.

SECTION 5: UNLIMITED LIABILITY
IN NO EVENT SHALL PROVIDER'S LIABILITY BE LIMITED TO FEES PAID. CUSTOMER AGREES THAT CUSTOMER SHALL BEAR UNLIMITED LIABILITY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, INCIDENTAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO SERVICE USAGE. THERE SHALL BE NO LIMITATION OF LIABILITY OR CAP ON CUSTOMER'S OBLIGATIONS.

SECTION 6: INDEMNIFICATION
Customer shall defend, indemnify and hold harmless Provider and its officers, directors, and agents from any and all claims, damages, liabilities, costs, and expenses (including attorneys' fees) arising out of or related in any way to this Agreement, regardless of whether Provider was negligent.

SECTION 7: UNILATERAL TERMINATION FOR CONVENIENCE
Provider may terminate this agreement at any time without cause and for any reason upon five (5) days written notice. Customer shall have no right to terminate for convenience.

SECTION 8: RESTRICTIVE COVENANTS AND NON-COMPETE
During the term of this Agreement and for a period of three (3) years thereafter, Customer and its affiliates shall not engage in any business that competes with Provider within any geographical market where Provider operates.

SECTION 9: GOVERNING LAW AND EXCLUSIVE JURISDICTION
This Agreement shall be governed by the laws of England and Wales, and the parties submit to the exclusive jurisdiction of the courts of London.`
      },
      {
        title: 'Mutual Non-Disclosure Agreement - Apex Health Corp',
        type: 'Non-Disclosure Agreement',
        fileName: 'Mutual_NDA_ApexHealth.docx',
        text: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made and entered into this 10th day of February, 2025, by and between Apex Health Corporation, a California corporation ("Apex"), and BioSecure Innovations Inc. ("BioSecure").

SECTION 1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public technical, operational, and financial information disclosed by either party, whether orally or in writing.

SECTION 2. OBLIGATIONS OF CONFIDENTIALITY
Each party as Recipient agrees to hold the Disclosing Party's Confidential Information in strict confidence and not to disclose such information to third parties without prior written consent.

SECTION 3. TERM AND SURVIVAL
The term of this Agreement shall be two (2) years. The confidentiality obligations under this Agreement shall survive for a period of five (5) years following termination.

SECTION 4. PERMITTED DISCLOSURES
A Recipient may disclose Confidential Information to the extent required by applicable law, provided that the Recipient gives prompt written notice to the Disclosing Party to permit seeking a protective order.

SECTION 5. GOVERNING LAW AND JURISDICTION
This Agreement is governed by the laws of the State of California. Any dispute shall be resolved in the state or federal courts located in San Francisco County, California.`
      },
      {
        title: 'Standard Vendor Software Agreement - SecureStack',
        type: 'Software License Agreement',
        fileName: 'Vendor_Agreement_SecureStack.docx',
        text: `VENDOR SOFTWARE & LICENSE AGREEMENT

This Vendor Software & License Agreement ("Agreement") is effective as of March 1, 2025, by and between SecureStack Technologies Inc. ("Vendor"), and Enterprise Systems Corp ("Customer").

SECTION 1. GRANT OF LICENSE
Vendor grants Customer a non-exclusive, worldwide license to use the Software solely for internal business operations during the subscription term.

SECTION 2. FEES AND PAYMENT
Invoices are payable within Net 30 days of receipt. In the event of a good faith billing dispute, Customer shall pay the undisputed portion and the parties shall work diligently in good faith to resolve the disputed amount.

SECTION 3. LIMITATION OF LIABILITY
EXCEPT FOR WILLFUL MISCONDUCT OR BREACH OF CONFIDENTIALITY, IN NO EVENT SHALL EITHER PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF THIS AGREEMENT EXCEED THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT. NEITHER PARTY SHALL BE LIABLE FOR CONSEQUENTIAL DAMAGES.

SECTION 4. TERMINATION
Either party may terminate this Agreement for convenience upon giving at least sixty (60) days prior written notice. Either party may terminate immediately if the other party materially breaches and fails to cure within thirty (30) days of written notice.

SECTION 5. INTELLECTUAL PROPERTY
Each party retains all right, title, and interest in its pre-existing intellectual property. Customer owns all rights in its customer data and output deliverables.

SECTION 6. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by the laws of the State of Delaware. Any dispute shall be submitted to binding arbitration under the Commercial Rules of the American Arbitration Association.`
      }
    ];

    for (const c of contractsToSeed) {
      const filePath = path.join(config.uploadDir, c.fileName);
      fs.writeFileSync(filePath, c.text, 'utf-8');

      const created = await repo.createContract({
        userId: demoUser!.id,
        title: c.title,
        contractType: c.type,
        fileName: c.fileName,
        fileSize: Buffer.byteLength(c.text),
        fileType: 'docx',
        filePath,
        status: 'PROCESSING',
        processingProgress: 20,
        processingStage: 'Pre-indexing demo contract'
      });

      // Run document parsing and analysis
      const processed = await processor.processFile(filePath, 'docx', created.id);
      const savedClauses = await repo.saveClauses(created.id, processed.clauses);
      await repo.saveChunks(created.id, processed.chunks);

      await orchestrator.runFullAnalysis(created.id, c.text, savedClauses);
      console.log(`✓ Seeded demo contract: "${c.title}"`);
    }
  }
}
