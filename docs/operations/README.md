# Operations Documentation

This directory contains operational documentation for the Deessa Foundation platform.

## 📚 Documentation Index

### Security & Credential Management

- **[Credential Rotation Guide](./CREDENTIAL_ROTATION_GUIDE.md)** - Comprehensive guide for rotating all payment credentials and API keys
  - Step-by-step procedures for each provider (Stripe, Khalti, eSewa)
  - Receipt token secret generation
  - Testing and validation procedures
  - Emergency rollback procedures
  - Best practices and security reminders

- **[Credential Rotation Checklist](./CREDENTIAL_ROTATION_CHECKLIST.md)** - Quick reference checklist for quarterly rotations
  - Pre-rotation preparation
  - Provider-specific checklists
  - Verification steps
  - Post-rotation documentation

### Automation Scripts

Located in `/scripts/` directory:

#### Secret Generation
- `generate-secrets.ps1` (Windows PowerShell)
- `generate-secrets.sh` (Linux/Mac Bash)

Generates cryptographically secure secrets for:
- Receipt Token Secret (JWT signing)
- CRON Secret (cron endpoint authentication)
- Receipt Resend API Key (programmatic access)

**Usage:**
```bash
# Windows
.\scripts\generate-secrets.ps1

# Linux/Mac
./scripts/generate-secrets.sh
```

#### Credential Testing
- `test-credentials.ps1` (Windows PowerShell)
- `test-credentials.sh` (Linux/Mac Bash)

Validates all payment credentials are properly configured:
- Checks environment variables are set
- Validates credential formats
- Verifies secret lengths
- Tests payment mode configuration

**Usage:**
```bash
# Windows
.\scripts\test-credentials.ps1

# Linux/Mac
./scripts/test-credentials.sh
```

## 🔄 Routine Operations

### Quarterly Credential Rotation

**Schedule:** Every 90 days

**Process:**
1. Review [Credential Rotation Guide](./CREDENTIAL_ROTATION_GUIDE.md)
2. Use [Rotation Checklist](./CREDENTIAL_ROTATION_CHECKLIST.md) to track progress
3. Generate new secrets using automation scripts
4. Rotate provider credentials via dashboards
5. Test all payment flows
6. Document completion and schedule next rotation

### Pre-Production Deployment

Before deploying to production:

1. **Generate Production Secrets**
   ```bash
   .\scripts\generate-secrets.ps1
   ```

2. **Add to Vercel Environment**
   ```bash
   vercel env add RECEIPT_TOKEN_SECRET production
   vercel env add CRON_SECRET production
   vercel env add RECEIPT_RESEND_API_KEY production
   ```

3. **Rotate Provider Credentials**
   - Follow [Credential Rotation Guide](./CREDENTIAL_ROTATION_GUIDE.md)
   - Use production credentials (not test/sandbox)

4. **Validate Configuration**
   ```bash
   .\scripts\test-credentials.ps1
   ```

5. **Verify Security**
   - Confirm `.env` in `.gitignore`
   - Audit git history for exposed secrets
   - Verify no mock bypasses in production code
   - Test webhook signature verification

## 🚨 Emergency Procedures

### Credential Compromise

If credentials are suspected to be compromised:

1. **Immediate Actions**
   - Rotate affected credentials immediately
   - Monitor for unauthorized access
   - Review audit logs for suspicious activity

2. **Follow Rotation Guide**
   - Use emergency rotation procedures in [Credential Rotation Guide](./CREDENTIAL_ROTATION_GUIDE.md)
   - Document incident and response

3. **Post-Incident**
   - Conduct security audit
   - Update access controls
   - Review and improve security practices

### Rollback Procedures

If issues occur after credential rotation:

1. **Identify Failing Component**
   - Check application logs
   - Check provider dashboard logs

2. **Revert Credentials**
   - Update environment variables to old values
   - Redeploy immediately

3. **Verify Rollback**
   - Test payment flows
   - Monitor for errors

4. **Investigate Root Cause**
   - Review rotation steps
   - Contact provider support if needed

See detailed rollback procedures in [Credential Rotation Guide](./CREDENTIAL_ROTATION_GUIDE.md).

## 📞 Support Contacts

### Provider Support

- **Stripe Support:** https://support.stripe.com/
- **Khalti Support:** support@khalti.com
- **eSewa Support:** https://esewa.com.np/support

### Internal Contacts

- **DevOps Team:** [Your team contact]
- **Security Team:** [Your security contact]
- **On-Call Engineer:** [Your on-call contact]

## 📋 Compliance & Audit

### Data Retention

- Payment event logs: 7 years (regulatory requirement)
- Raw webhook payloads: 90 days (dispute resolution)
- Audit logs: 7 years (compliance)

### Audit Trail

All credential rotations must be documented:
- Date of rotation
- Person who performed rotation
- Credentials rotated
- Any issues encountered
- Next rotation due date

Use [Rotation Checklist](./CREDENTIAL_ROTATION_CHECKLIST.md) to maintain audit trail.

## 🔗 Related Documentation

### Payment System
- [Payment Architecture V2 Design](../payments-v2/DESIGN.md)
- [Payment API Documentation](../api/PAYMENTS_V2.md)
- [Payment System Audit](../PAYMENT_SYSTEM_AUDIT.md)

### Deployment
- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [Environment Configuration](../deployment/ENVIRONMENT_SETUP.md)

### Development
- [Getting Started](../../README.md#getting-started)
- [Contributing Guidelines](../../CONTRIBUTING.md)

## 📝 Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-03-03 | 1.0 | Initial operations documentation | Payment V2 Implementation |

---

**Last Updated:** 2026-03-03  
**Maintained By:** DevOps Team  
**Review Schedule:** Quarterly
