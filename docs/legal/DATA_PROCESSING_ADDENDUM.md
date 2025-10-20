# Data Processing Addendum (DPA)

**Last Updated**: January 20, 2025
**Effective Date**: January 20, 2025

This Data Processing Addendum ("DPA") forms part of the Terms of Service between you ("Customer", "Data Controller") and PRPM ("Processor", "Data Processor") for the use of PRPM services.

## 1. Definitions

**"Controller"**: The entity that determines the purposes and means of processing Personal Data (You/Customer).

**"Processor"**: The entity that processes Personal Data on behalf of the Controller (PRPM).

**"Personal Data"**: Any information relating to an identified or identifiable natural person, as defined in GDPR Article 4(1).

**"Processing"**: Any operation performed on Personal Data, including collection, storage, use, disclosure, deletion.

**"Sub-processor"**: Any third party appointed by PRPM to process Personal Data.

**"Data Subject"**: An identified or identifiable natural person whose Personal Data is processed.

**"GDPR"**: General Data Protection Regulation (EU) 2016/679.

**"Services"**: PRPM package registry, CLI, web interface, and related services.

## 2. Scope and Applicability

### 2.1 When This DPA Applies
This DPA applies when:
- Customer uses PRPM Team, Business, or Enterprise plans
- Customer processes Personal Data of end users (team members, employees)
- Customer is subject to GDPR or similar data protection laws

### 2.2 Relationship to Terms of Service
- This DPA supplements the Terms of Service
- In case of conflict, this DPA prevails for data protection matters
- Both documents must be read together

### 2.3 Personal Data Processed
Personal Data processed under this DPA includes:
- Team member names and email addresses
- User account information
- Package metadata (if containing Personal Data)
- Usage logs and analytics
- Any other data submitted by Customer containing Personal Data

## 3. Roles and Responsibilities

### 3.1 Customer as Controller
Customer:
- Determines purposes and means of processing Personal Data
- Is responsible for the lawfulness of processing
- Must provide privacy notices to Data Subjects
- Must obtain necessary consents from Data Subjects
- Must respond to Data Subject requests (with Processor assistance)
- Warrants it has authority to transfer Personal Data to Processor

### 3.2 PRPM as Processor
PRPM:
- Processes Personal Data only on behalf of Customer
- Follows Customer's documented instructions
- Does not use Personal Data for own purposes (except as required by law)
- Implements appropriate technical and organizational measures
- Assists Customer with Data Subject requests
- Assists Customer with security and compliance obligations

## 4. Processing Instructions

### 4.1 Scope of Instructions
PRPM shall process Personal Data only:
- To provide the Services as described in the Terms of Service
- To comply with other reasonable instructions from Customer
- As required by applicable law (with notice to Customer where feasible)

### 4.2 Prohibited Processing
PRPM shall NOT:
- Process Personal Data for its own purposes (except as legally required)
- Sell or rent Personal Data
- Disclose Personal Data to third parties (except Sub-processors)
- Transfer Personal Data outside authorized regions (without Customer consent)

### 4.3 Additional Instructions
Customer may provide additional written instructions via:
- Email to dpo@prpm.dev
- Support ticket
- Enterprise customer support channel

PRPM will notify Customer if instructions conflict with GDPR or other laws.

## 5. Data Subject Rights

### 5.1 Assistance with Requests
PRPM shall assist Customer in responding to Data Subject requests:
- Access requests (GDPR Article 15)
- Rectification requests (GDPR Article 16)
- Erasure/deletion requests (GDPR Article 17)
- Restriction of processing (GDPR Article 18)
- Data portability (GDPR Article 20)
- Objection to processing (GDPR Article 21)

### 5.2 Tools Provided
PRPM provides self-service tools for common requests:
- Account settings for access and correction
- Export functionality for data portability
- Account deletion for erasure requests

### 5.3 Response Time
PRPM will respond to Customer requests for assistance within:
- 5 business days for standard requests
- 48 hours for urgent requests
- As required by applicable law (whichever is shorter)

### 5.4 Fees
Assistance with Data Subject requests is included in paid plans. Excessive or complex requests may incur reasonable fees.

## 6. Sub-processors

### 6.1 Authorized Sub-processors
Customer authorizes PRPM to engage the following Sub-processors:

| Sub-processor | Service | Location | Purpose |
|---------------|---------|----------|---------|
| Amazon Web Services (AWS) | Cloud infrastructure | United States | Hosting, storage, database |
| GitHub Inc. | Authentication | United States | OAuth login |
| Stripe Inc. | Payment processing | United States | Billing, subscriptions |
| Plausible Analytics | Analytics | EU (Germany) | Privacy-focused analytics |
| CloudFlare Inc. | CDN, Security | Global | DDoS protection, CDN |

Full list: https://prpm.dev/legal/subprocessors

### 6.2 Sub-processor Requirements
All Sub-processors must:
- Sign data processing agreements with equivalent protections
- Implement appropriate security measures
- Comply with GDPR and applicable laws
- Be subject to audit and inspection

### 6.3 Changes to Sub-processors
PRPM will notify Customer of new Sub-processors via:
- Email to account email (30 days advance notice)
- Updates to https://prpm.dev/legal/subprocessors

Customer may object within 30 days by emailing dpo@prpm.dev. If objection cannot be resolved, Customer may terminate the subscription with pro-rated refund.

### 6.4 Liability
PRPM remains liable for Sub-processor acts and omissions to the same extent as if PRPM performed the services directly.

## 7. Security Measures

### 7.1 Technical Measures
PRPM implements the following security measures:

**Encryption**:
- TLS 1.3 for data in transit
- AES-256 encryption for data at rest
- Encrypted database backups

**Access Control**:
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA) for staff
- Principle of least privilege
- Regular access reviews

**Network Security**:
- Firewall protection
- DDoS mitigation (CloudFlare)
- Intrusion detection systems
- Network segmentation

**Application Security**:
- Secure coding practices
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens

### 7.2 Organizational Measures
PRPM implements the following organizational measures:

**Personnel Security**:
- Background checks for employees with data access
- Confidentiality agreements for all staff
- Security training (annually)
- Access revocation upon termination

**Incident Management**:
- Security incident response plan
- 24/7 monitoring and alerting
- Breach notification procedures
- Regular incident drills

**Business Continuity**:
- Daily automated backups
- Disaster recovery plan
- 99.9% uptime target
- Geographic redundancy

### 7.3 Security Audits
PRPM conducts:
- Quarterly vulnerability scans
- Annual penetration testing
- SOC 2 Type II audit (roadmap for 2026)

Audit reports available to Enterprise customers under NDA.

### 7.4 Customer Responsibilities
Customer must:
- Use strong passwords
- Enable MFA on accounts
- Restrict access to authorized users only
- Report suspected security incidents immediately
- Comply with security best practices

## 8. Data Breaches

### 8.1 Notification
In the event of a Personal Data breach, PRPM will:
- Notify Customer without undue delay (within 72 hours of discovery)
- Provide available information about the breach
- Assist Customer with regulatory notifications

### 8.2 Breach Information
Notification will include:
- Nature of the breach
- Categories and approximate number of Data Subjects affected
- Categories and approximate number of records affected
- Contact point for more information
- Likely consequences of the breach
- Measures taken or proposed to address the breach

### 8.3 Investigation
PRPM will:
- Investigate the breach promptly
- Take reasonable steps to mitigate harm
- Document the breach and response
- Provide updates as investigation progresses

### 8.4 Customer Obligations
Customer is responsible for:
- Notifying Data Subjects (where required by law)
- Notifying supervisory authorities (where required)
- Determining legal obligations under applicable law

## 9. Data Transfers

### 9.1 Data Location
Personal Data is stored in:
- **Primary**: AWS us-east-1 (United States)
- **Backups**: AWS us-west-2 (United States)
- **CDN**: CloudFlare global network (cached data only)

### 9.2 International Transfers (GDPR)
For transfers of Personal Data from the EEA to the United States, PRPM relies on:

**Standard Contractual Clauses (SCCs)**:
- Module Two: Controller-to-Processor transfers
- Module Three: Processor-to-Processor transfers (Sub-processors)
- EU Commission approved SCCs (2021)

**Supplementary Measures**:
- Encryption in transit and at rest
- Access controls and logging
- Contractual restrictions on government access
- Regular security audits

### 9.3 UK and Swiss Transfers
For UK: SCCs adapted for UK GDPR (UK Addendum)
For Switzerland: Swiss Federal Data Protection Act compliant

### 9.4 Other Regions
For other jurisdictions with data localization requirements, contact sales@prpm.dev for regional hosting options.

## 10. Data Retention and Deletion

### 10.1 Retention Periods
PRPM retains Personal Data for:
- **Active accounts**: Duration of subscription
- **Deleted accounts**: 30 days (grace period)
- **Backups**: Up to 90 days (rolling backups)
- **Logs**: 90 days

### 10.2 Deletion Process
Upon subscription termination or Customer request, PRPM will:
1. Provide 30-day grace period for data export
2. Delete Personal Data from production systems (within 30 days)
3. Delete Personal Data from backups (within 90 days)
4. Provide written confirmation of deletion (upon request)

### 10.3 Legal Holds
PRPM may retain Personal Data longer if required by law, litigation, or regulatory investigation. Customer will be notified.

### 10.4 Anonymization
As an alternative to deletion, PRPM may anonymize Personal Data such that it can no longer identify individuals. Anonymized data is not subject to GDPR.

## 11. Audits and Inspections

### 11.1 Right to Audit
Customer has the right to audit PRPM's compliance with this DPA, subject to:
- Reasonable advance notice (30 days)
- Audits conducted during business hours
- No more than once per year (unless breach or regulatory requirement)
- Confidentiality obligations
- Reasonable costs (if excessive)

### 11.2 Audit Information
PRPM will provide:
- Documentation of security measures
- Relevant policies and procedures
- Audit logs and reports
- SOC 2 reports (when available, under NDA)

### 11.3 Third-Party Audits
Customer may use independent third-party auditors, subject to:
- PRPM approval (not unreasonably withheld)
- Confidentiality agreements
- Professional conduct
- Reasonable scope

### 11.4 Remediation
If an audit reveals non-compliance, PRPM will:
- Provide a remediation plan within 30 days
- Implement corrections within a reasonable timeframe
- Provide status updates

## 12. Liability and Indemnification

### 12.1 Limitation of Liability
PRPM's total liability under this DPA is limited to the amounts set forth in the Terms of Service.

### 12.2 Customer Indemnification
Customer indemnifies PRPM against claims arising from:
- Customer's violation of data protection laws
- Unlawful processing instructions from Customer
- Customer's failure to obtain necessary consents

### 12.3 PRPM Indemnification
PRPM indemnifies Customer against claims arising from:
- PRPM's violation of this DPA
- Unauthorized disclosure of Personal Data
- Failure to implement required security measures

## 13. Term and Termination

### 13.1 Term
This DPA takes effect upon acceptance of the Terms of Service and continues as long as PRPM processes Personal Data on behalf of Customer.

### 13.2 Termination
This DPA terminates automatically upon:
- Termination of the Terms of Service
- Deletion of all Personal Data
- Customer notification to dpo@prpm.dev

### 13.3 Post-Termination
Upon termination, PRPM will:
- Cease processing Personal Data
- Delete or return Personal Data (Customer's choice)
- Provide certification of deletion (upon request)
- Delete Personal Data from Sub-processors

### 13.4 Survival
Sections on confidentiality, liability, and audit rights survive termination.

## 14. Changes to This DPA

PRPM may update this DPA to:
- Reflect changes in law
- Reflect changes to Sub-processors
- Improve security measures

Material changes require 30 days notice. Continued use constitutes acceptance.

## 15. Governing Law and Disputes

### 15.1 Governing Law
This DPA is governed by the same law as the Terms of Service.

### 15.2 Disputes
Disputes shall be resolved per the dispute resolution process in the Terms of Service.

### 15.3 Regulatory Priority
If a data protection authority rules this DPA is insufficient, PRPM will work with Customer to implement required changes.

## 16. Contact Information

### 16.1 Data Protection Officer
Email: dpo@prpm.dev

### 16.2 Security Team
Email: security@prpm.dev

### 16.3 Legal Team
Email: legal@prpm.dev

### 16.4 Emergency Contact
For security incidents: security@prpm.dev (monitored 24/7)

---

## Annex 1: Details of Processing

### A. Subject Matter and Duration
- **Subject Matter**: Provision of PRPM package registry services
- **Duration**: Duration of subscription + 90 days

### B. Nature and Purpose
- **Nature**: Hosting, storage, distribution of AI prompt packages
- **Purpose**: Enable Customer to manage and share packages with team members

### C. Types of Personal Data
- Email addresses
- Usernames
- Display names
- Team affiliations
- Usage logs (IP addresses, timestamps)
- Package metadata (if containing Personal Data)

### D. Categories of Data Subjects
- Customer's employees
- Customer's contractors
- Team members invited by Customer
- End users of Customer's packages (if Personal Data in metadata)

### E. Customer Obligations
- Obtain necessary consents from Data Subjects
- Provide privacy notices
- Respond to Data Subject requests
- Ensure lawfulness of processing

### F. Processor Obligations
- Process only per Customer instructions
- Implement security measures
- Assist with Data Subject requests
- Notify of data breaches

---

## Annex 2: Technical and Organizational Measures

See Section 7 (Security Measures) above.

---

## Annex 3: Sub-processors

See Section 6 (Sub-processors) above and https://prpm.dev/legal/subprocessors

---

**By using PRPM Team, Business, or Enterprise plans, you acknowledge and agree to this Data Processing Addendum.**

**Questions?** Contact dpo@prpm.dev

**Last reviewed**: January 20, 2025
