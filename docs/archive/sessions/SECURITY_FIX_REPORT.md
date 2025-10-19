# Security Fix Report - Redis/Postgres/MinIO Public Exposure

**Date:** 2025-10-19
**Severity:** CRITICAL
**Status:** ✅ RESOLVED

## Issue Summary

The PRPM registry's Docker Compose configuration was exposing internal services (Redis, PostgreSQL, MinIO) to the **public Internet** on all network interfaces (`0.0.0.0`).

### Affected Services

| Service | Port | Previous Binding | Risk Level |
|---------|------|------------------|------------|
| Redis | 6379 | `0.0.0.0:6379` | 🔴 CRITICAL |
| PostgreSQL | 5432 | `0.0.0.0:5432` | 🔴 CRITICAL |
| MinIO | 9000-9001 | `0.0.0.0:9000-9001` | 🔴 CRITICAL |

### Security Risks

1. **Redis (Port 6379)**
   - Unauthorized data access
   - Cache poisoning
   - Potential remote code execution (if misconfigured)
   - Session hijacking

2. **PostgreSQL (Port 5432)**
   - Database credential attacks
   - SQL injection attempts
   - Data exfiltration
   - Brute force attacks

3. **MinIO (Port 9000-9001)**
   - Unauthorized file access
   - Data tampering
   - Storage resource abuse
   - Credential harvesting

## Fix Applied

### Changes Made

Modified `/packages/registry/docker-compose.yml` to bind all internal services to `127.0.0.1` (localhost only):

**Before:**
```yaml
redis:
  ports:
    - "6379:6379"  # ⚠️ Accessible from anywhere

postgres:
  ports:
    - "5432:5432"  # ⚠️ Accessible from anywhere

minio:
  ports:
    - "9000:9000"  # ⚠️ Accessible from anywhere
    - "9001:9001"
```

**After:**
```yaml
redis:
  ports:
    - "127.0.0.1:6379:6379"  # ✅ Localhost only

postgres:
  ports:
    - "127.0.0.1:5432:5432"  # ✅ Localhost only

minio:
  ports:
    - "127.0.0.1:9000:9000"  # ✅ Localhost only
    - "127.0.0.1:9001:9001"  # ✅ Localhost only
```

### Verification

**After Fix:**
```bash
$ docker ps --format "table {{.Names}}\t{{.Ports}}"
NAMES           PORTS
prpm-redis      127.0.0.1:6379->6379/tcp        ✅
prpm-postgres   127.0.0.1:5432->5432/tcp        ✅
prpm-minio      127.0.0.1:9000-9001->9000-9001/tcp  ✅
prpm-registry   0.0.0.0:3000->3000/tcp          ✅ (Public API - expected)
```

**External Access Test:**
```bash
$ telnet 142.93.37.105 6379
Trying 142.93.37.105...
telnet: Unable to connect to remote host: Connection refused
✅ GOOD - Redis is not publicly accessible
```

## Impact

### Services Protected
- ✅ Redis no longer accessible from Internet
- ✅ PostgreSQL no longer accessible from Internet
- ✅ MinIO no longer accessible from Internet
- ✅ Registry API still publicly accessible (as intended)

### Functionality Preserved
- ✅ Local development still works
- ✅ Docker container networking unaffected
- ✅ Registry can still connect to all services
- ✅ Webapp can still connect to registry

## Deployment Steps Taken

```bash
# 1. Updated docker-compose.yml with localhost bindings
# 2. Stopped all containers
docker compose -f packages/registry/docker-compose.yml down

# 3. Restarted with new secure configuration
docker compose -f packages/registry/docker-compose.yml up -d

# 4. Verified security fix
docker ps --format "table {{.Names}}\t{{.Ports}}"
telnet 142.93.37.105 6379  # Connection refused ✅
```

## Recommendations

### Immediate Actions ✅ COMPLETED
- [x] Bind Redis to localhost only
- [x] Bind PostgreSQL to localhost only
- [x] Bind MinIO to localhost only
- [x] Restart all containers
- [x] Verify external access blocked

### Additional Security Hardening (Recommended)

1. **Enable Authentication**
   ```yaml
   redis:
     command: redis-server --requirepass ${REDIS_PASSWORD}

   postgres:
     environment:
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Use strong password from env
   ```

2. **Use Docker Secrets** (for production)
   ```yaml
   services:
     postgres:
       secrets:
         - db_password
   secrets:
     db_password:
       external: true
   ```

3. **Enable TLS/SSL**
   - Configure Redis with TLS
   - Enable PostgreSQL SSL connections
   - Use HTTPS for MinIO

4. **Network Segmentation**
   ```yaml
   networks:
     internal:
       internal: true  # No external access
     public:
       # Only for registry API
   ```

5. **Add Rate Limiting**
   - Enable rate limiting on registry API
   - Configure fail2ban for SSH protection

6. **Regular Security Audits**
   ```bash
   # Check for exposed ports
   nmap -sT -O localhost

   # Verify Docker security
   docker scan prpm-registry

   # Check for CVEs
   trivy image postgres:15-alpine
   ```

## Prevention

### Docker Compose Best Practices

1. **Always bind to localhost for internal services:**
   ```yaml
   ports:
     - "127.0.0.1:6379:6379"  # ✅ Good
     - "6379:6379"            # ❌ Bad
   ```

2. **Use internal networks:**
   ```yaml
   networks:
     internal:
       internal: true
   ```

3. **Remove port bindings if not needed:**
   ```yaml
   # If external access not needed, omit ports entirely
   # Services communicate via Docker network
   ```

4. **Use environment variables for secrets:**
   ```yaml
   environment:
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # From .env
   ```

### Security Checklist for Deployment

- [ ] All internal services bound to 127.0.0.1
- [ ] Strong passwords for all services
- [ ] Secrets stored in environment variables or Docker secrets
- [ ] TLS/SSL enabled for production
- [ ] Firewall rules configured (ufw/iptables)
- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

## Additional Webapp Docker Compose Fix

Also updated `/packages/webapp/docker-compose.test.yml` with same security measures:

```yaml
postgres:
  ports:
    - "127.0.0.1:5433:5432"  # ✅ Localhost only

redis:
  ports:
    - "127.0.0.1:6380:6379"  # ✅ Localhost only

minio:
  ports:
    - "127.0.0.1:9002:9000"  # ✅ Localhost only
    - "127.0.0.1:9003:9001"  # ✅ Localhost only
```

## Monitoring

### Verify Security Regularly

```bash
# Check port bindings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Scan for open ports from external IP
nmap -sT 142.93.37.105

# Expected output:
# PORT     STATE    SERVICE
# 22/tcp   open     ssh      ✅ (SSH - OK)
# 3000/tcp open     ppp      ✅ (Registry API - OK)
# 5432/tcp filtered postgresql  ✅ (Filtered/closed - GOOD)
# 6379/tcp filtered redis       ✅ (Filtered/closed - GOOD)

# Test Redis access
timeout 2 telnet 142.93.37.105 6379
# Expected: Connection refused ✅
```

### Automated Monitoring

Consider setting up:
- Port scanning alerts (e.g., with fail2ban)
- Container security scanning (e.g., Trivy, Clair)
- Log monitoring for unauthorized access attempts

## Incident Timeline

| Time | Event |
|------|-------|
| Unknown | Services deployed with 0.0.0.0 binding |
| 2025-10-19 12:00 | Security scan notification received from hosting provider |
| 2025-10-19 12:05 | Issue investigated and confirmed |
| 2025-10-19 12:10 | Fix applied to docker-compose.yml |
| 2025-10-19 12:12 | Containers restarted with secure configuration |
| 2025-10-19 12:13 | Fix verified, external access blocked |
| 2025-10-19 12:15 | Documentation completed |

## Conclusion

**Status:** ✅ RESOLVED

All internal services (Redis, PostgreSQL, MinIO) are now properly secured and only accessible from localhost. The registry API remains publicly accessible as intended for the PRPM package manager functionality.

**No data breach detected** - This was caught before any known exploitation occurred.

## References

- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [Redis Security](https://redis.io/docs/management/security/)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
