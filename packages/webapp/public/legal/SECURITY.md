# Security & Compliance

**Last Updated**: January 20, 2025

At PRPM, security is a top priority. This document outlines our security practices, compliance commitments, and how we protect your data.

## 🔒 Security Overview

### Our Commitment
- Industry-standard security practices
- Proactive threat monitoring
- Regular security audits
- Transparent incident response
- Privacy by design

## 1. Infrastructure Security

### 1.1 Cloud Provider
**AWS (Amazon Web Services)**
- SOC 2 Type II certified
- ISO 27001 certified
- GDPR compliant
- US-based data centers (us-east-1, us-west-2)

### 1.2 Network Security
**Protections**:
- ✅ DDoS mitigation (CloudFlare)
- ✅ Web Application Firewall (WAF)
- ✅ Firewall rules restricting traffic
- ✅ Network segmentation
- ✅ Intrusion detection systems (IDS)
- ✅ Rate limiting

**Encryption**:
- ✅ TLS 1.3 for all traffic (HTTPS only)
- ✅ Perfect forward secrecy
- ✅ HSTS enabled
- ✅ A+ SSL Labs rating

### 1.3 Data Storage
**Database (PostgreSQL on RDS)**:
- ✅ Encryption at rest (AES-256)
- ✅ Automated backups (daily)
- ✅ Point-in-time recovery (7 days)
- ✅ Multi-AZ deployment (production)
- ✅ Encrypted backups

**Object Storage (S3)**:
- ✅ Server-side encryption (SSE-S3)
- ✅ Versioning enabled
- ✅ Access logging
- ✅ Bucket policies restricting access
- ✅ No public buckets

**Content Delivery (CloudFlare CDN)**:
- ✅ Cached content only (no sensitive data)
- ✅ HTTPS required
- ✅ Automatic cache purging
- ✅ Geographic distribution

## 2. Application Security

### 2.1 Secure Development
**Practices**:
- ✅ Security code reviews
- ✅ Dependency scanning (Snyk, Dependabot)
- ✅ Static analysis (ESLint, TypeScript strict mode)
- ✅ Input validation and sanitization
- ✅ Output encoding
- ✅ Parameterized queries (no SQL injection)

**Frameworks**:
- Fastify (secure by default)
- Helmet.js (security headers)
- CORS policies enforced
- CSRF protection

### 2.2 Authentication & Authorization

**Authentication**:
- ✅ GitHub OAuth 2.0 (no passwords stored)
- ✅ JWT tokens (signed with HS256)
- ✅ Token expiration (24 hours)
- ✅ Refresh token rotation
- ✅ Logout invalidates tokens

**Authorization**:
- ✅ Role-Based Access Control (RBAC)
- ✅ Organization-level permissions
- ✅ Package-level access control (public/private)
- ✅ Principle of least privilege
- ✅ API key scoping (read vs write)

**Multi-Factor Authentication (MFA)**:
- ⏳ Planned for Q2 2025 (via GitHub)

### 2.3 Package Security

**Upload Security**:
- ✅ File size limits (100MB max)
- ✅ File type validation
- ✅ Malware scanning (ClamAV)
- ✅ Content Security Policy
- ✅ No executable files allowed

**Package Integrity**:
- ✅ Checksums (SHA-256) for all packages
- ✅ Immutable versions (cannot modify published versions)
- ✅ Version signing (roadmap)
- ✅ Provenance tracking (roadmap)

**Vulnerability Scanning**:
- ⏳ Automated vulnerability detection (planned)
- ⏳ Security advisories for packages (planned)
- ⏳ Automated notifications to package authors (planned)

### 2.4 API Security

**Rate Limiting**:
- Free tier: 10 req/min, 1,000/month
- Paid tiers: Higher limits
- 429 status for exceeded limits
- Exponential backoff required

**API Keys**:
- ✅ Scoped permissions (read-only, publish, admin)
- ✅ Stored hashed (bcrypt)
- ✅ Rotation supported
- ✅ Revocation via dashboard
- ✅ Last used tracking

**Input Validation**:
- ✅ Schema validation (Zod)
- ✅ Type checking (TypeScript)
- ✅ Length limits
- ✅ Sanitization of user input

## 3. Access Control

### 3.1 Employee Access
**Policies**:
- ✅ Background checks for all employees
- ✅ Confidentiality agreements (NDAs)
- ✅ Principle of least privilege
- ✅ MFA required for all staff
- ✅ Access reviewed quarterly
- ✅ Immediate revocation upon termination

**Access Levels**:
- **Read-Only**: Customer support (view data only)
- **Standard**: Engineers (normal development)
- **Elevated**: Senior engineers (database access with approval)
- **Admin**: CTO/Security team (full access, audited)

**Audit Logging**:
- ✅ All admin actions logged
- ✅ Database queries logged
- ✅ Logs retained for 1 year
- ✅ Quarterly access reviews

### 3.2 Physical Security
**AWS Data Centers**:
- 24/7 security guards
- Biometric access controls
- Video surveillance
- Environmental controls

**Office Security** (if applicable):
- Locked server rooms
- Badge access required
- Visitor logs
- Encrypted laptops (BitLocker/FileVault)

## 4. Incident Response

### 4.1 Security Incident Response Plan

**Detection**:
- 24/7 automated monitoring
- Alerting for anomalies
- Log analysis (CloudWatch)
- User reports (security@prpm.dev)

**Response Process**:
1. **Identification** (within 1 hour)
   - Alert received or incident reported
   - Initial assessment of severity
   - Security team notified

2. **Containment** (within 4 hours)
   - Isolate affected systems
   - Prevent further damage
   - Preserve evidence

3. **Investigation** (within 24 hours)
   - Determine root cause
   - Assess scope and impact
   - Identify affected users/data

4. **Notification** (within 72 hours)
   - Notify affected users
   - Notify regulators (if required by law)
   - Publish incident report (after resolution)

5. **Recovery** (within 48 hours)
   - Restore systems from backups
   - Apply patches/fixes
   - Verify integrity

6. **Post-Mortem** (within 7 days)
   - Root cause analysis
   - Document lessons learned
   - Update incident response plan
   - Implement preventive measures

### 4.2 Data Breach Notification

If a breach affects personal data:
- **Users**: Notified within 72 hours via email
- **Regulators**: Notified within 72 hours (GDPR requirement)
- **Public**: Incident report published (after mitigation)

**Notification Includes**:
- Nature of the breach
- Data affected
- Potential consequences
- Mitigation steps taken
- Actions users should take
- Contact information for questions

### 4.3 Reporting a Security Issue

**How to Report**:
- Email: security@prpm.dev
- PGP Key: [Available at https://prpm.dev/security.txt]
- Response time: 24 hours

**Include**:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Your contact information

**Our Commitment**:
- Acknowledge within 24 hours
- Provide status updates every 5 business days
- Notify you when issue is resolved
- Credit you in security advisories (unless you prefer anonymity)

**Responsible Disclosure**:
- Allow 90 days for remediation before public disclosure
- Coordinate disclosure timing with us
- Do not exploit vulnerability maliciously

**Bug Bounty** (planned for 2026):
- Rewards for security researchers
- Tiered payouts based on severity
- Hall of fame for contributors

## 5. Compliance & Certifications

### 5.1 Current Compliance

**GDPR (General Data Protection Regulation)**:
- ✅ Data Processing Addendum (DPA) available
- ✅ Standard Contractual Clauses (SCCs)
- ✅ Right to access, deletion, portability
- ✅ Privacy by design
- ✅ Data breach notification process
- ✅ Privacy Policy published

**CCPA (California Consumer Privacy Act)**:
- ✅ Privacy Policy disclosure
- ✅ Right to know, delete, opt-out
- ✅ No sale of personal information

**CAN-SPAM Act**:
- ✅ Unsubscribe link in all marketing emails
- ✅ Opt-out honored within 10 days
- ✅ Accurate sender information

### 5.2 Certifications Roadmap

**2025**:
- ⏳ SOC 2 Type I (in progress)

**2026**:
- ⏳ SOC 2 Type II
- ⏳ ISO 27001
- ⏳ PCI DSS (if we handle card data directly)

**Why These Certifications Matter**:
- SOC 2: Industry-standard for SaaS security
- ISO 27001: Global information security standard
- PCI DSS: Required for payment card processing

### 5.3 Audit Reports

**SOC 2 Reports**:
- Available to Enterprise customers (under NDA)
- Request: sales@prpm.dev

**Penetration Tests**:
- Conducted annually
- Summary available upon request
- Full report available to Enterprise customers (under NDA)

## 6. Data Privacy

### 6.1 Data Collection
We collect only what's necessary:
- Account information (email, username from GitHub)
- Package metadata and content
- Usage analytics (downloads, searches)
- Billing information (via Stripe, not stored by us)

See our [Privacy Policy](./PRIVACY_POLICY.md) for details.

### 6.2 Data Minimization
- No tracking cookies (except essential)
- Privacy-focused analytics (Plausible)
- No sale of personal data
- No third-party advertising

### 6.3 Data Retention
- Account data: Deleted 30 days after account deletion
- Package data: Retained indefinitely (unless unpublished)
- Logs: 90 days
- Backups: 90 days (rolling)

### 6.4 Data Portability
- Export all your packages: `prpm export`
- Export account data: Account settings → Export
- Machine-readable format (JSON)

### 6.5 Right to Deletion
- Delete individual packages: `prpm unpublish`
- Delete account: Account settings → Delete Account
- Request via email: privacy@prpm.dev
- Processing time: Within 30 days

## 7. Third-Party Security

### 7.1 Sub-processors

All third parties are vetted for security:

| Provider | Purpose | Certifications |
|----------|---------|----------------|
| AWS | Infrastructure | SOC 2, ISO 27001, PCI DSS |
| GitHub | Authentication | SOC 2, ISO 27001 |
| Stripe | Payment processing | PCI DSS Level 1, SOC 2 |
| CloudFlare | CDN, DDoS protection | SOC 2, ISO 27001 |
| Plausible | Analytics | GDPR compliant, EU-hosted |

Full list: https://prpm.dev/legal/subprocessors

### 7.2 Vendor Management
- ✅ Security questionnaires for all vendors
- ✅ Data processing agreements (DPAs)
- ✅ Regular security reviews
- ✅ Vendor audit rights in contracts

## 8. Business Continuity

### 8.1 Backups
**Database**:
- Automated daily backups (RDS)
- 7-day retention
- Point-in-time recovery
- Cross-region replication (production)
- Encrypted backups (AES-256)

**Packages**:
- Stored in S3 with versioning
- Cross-region replication
- 99.999999999% durability (AWS SLA)

**Testing**:
- Quarterly backup restoration tests
- Documented recovery procedures

### 8.2 Disaster Recovery
**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 1 hour

**Scenarios Covered**:
- Data center failure
- Database corruption
- Accidental deletion
- Ransomware attack
- Regional AWS outage

**Failover**:
- Automated failover to standby database (Multi-AZ)
- Manual failover to secondary region (if needed)
- DNS TTL: 60 seconds for fast cutover

### 8.3 High Availability
**Production Environment**:
- Multi-AZ deployment (99.95% uptime SLA)
- Load balancing (Elastic Beanstalk ALB)
- Auto-scaling (based on CPU/memory)
- Health checks every 30 seconds

**Monitoring**:
- CloudWatch metrics and alarms
- 24/7 on-call rotation
- PagerDuty escalation
- Status page: status.prpm.dev

## 9. Secure Development Lifecycle

### 9.1 Code Review
- ✅ All code reviewed before merge
- ✅ Automated checks (CI/CD)
- ✅ Security-focused reviews for sensitive changes
- ✅ Peer review required

### 9.2 Testing
- ✅ Unit tests (>50% coverage target)
- ✅ Integration tests
- ✅ End-to-end tests
- ✅ Security tests (OWASP Top 10)
- ✅ Penetration testing (annually)

### 9.3 Dependency Management
- ✅ Automated dependency updates (Dependabot)
- ✅ Vulnerability scanning (Snyk)
- ✅ License compliance checks
- ✅ Immediate patching of critical vulnerabilities

### 9.4 Deployment
- ✅ Automated deployments (GitHub Actions)
- ✅ Canary deployments (test on subset first)
- ✅ Rollback capability (one-click)
- ✅ Deployment logs and audit trail

## 10. Security Training

### 10.1 Employee Training
- ✅ Security awareness training (annually)
- ✅ Phishing simulations (quarterly)
- ✅ Secure coding training for engineers
- ✅ GDPR and privacy training
- ✅ Incident response drills

### 10.2 Customer Education
- Security best practices documentation
- Blog posts on secure package management
- Email notifications for security updates
- Webinars on security (planned)

## 11. Transparency

### 11.1 Security.txt
We publish a security.txt file at:
- https://prpm.dev/.well-known/security.txt

Includes:
- Security contact
- PGP key
- Preferred languages
- Policy URL

### 11.2 Status Page
Real-time service status:
- https://status.prpm.dev (planned)

Subscribe to:
- Email notifications
- Slack integration
- RSS feed

### 11.3 Transparency Reports
Annual reports include:
- Government requests for data
- DMCA takedown requests
- Security incidents
- Uptime statistics

**First report**: Q1 2026

## 12. Contact

### 12.1 Security Team
- **Email**: security@prpm.dev
- **PGP Key**: [Available at https://prpm.dev/security.txt]
- **Response Time**: 24 hours

### 12.2 Data Protection Officer (DPO)
- **Email**: dpo@prpm.dev
- **Purpose**: GDPR, privacy inquiries

### 12.3 Bug Bounty (Planned 2026)
- **Program**: HackerOne or Bugcrowd
- **Rewards**: $50 - $5,000 depending on severity

---

## Summary

**Our Security Commitments**:
✅ Encryption everywhere (TLS 1.3, AES-256)
✅ Industry-standard authentication (OAuth, JWT)
✅ Regular security audits and testing
✅ Transparent incident response
✅ GDPR and CCPA compliant
✅ SOC 2 roadmap (2025-2026)
✅ No sale of your data

**Your Responsibilities**:
- Use strong, unique passwords (or rely on GitHub)
- Enable MFA on GitHub account
- Report security issues responsibly
- Keep your systems updated
- Review package permissions before installing

**Questions?** Contact security@prpm.dev

**Last reviewed**: January 20, 2025
