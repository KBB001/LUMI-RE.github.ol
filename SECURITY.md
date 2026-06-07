# 🔒 LUMIÈRE Security Guide

## Critical Security Issues Fixed

### ✅ 1. Password Hashing
**Problem**: Passwords stored in plain text
```javascript
// ❌ BEFORE
_pass: 'admin123'

// ✅ AFTER
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);
```

**Implementation**:
- Use `bcryptjs` with 12 salt rounds
- Never store plain text passwords
- Always hash on backend

---

### ✅ 2. XSS (Cross-Site Scripting) Protection
**Problem**: innerHTML with unsanitized user data
```javascript
// ❌ BEFORE
div.innerHTML = `<p>${userInput}</p>`; // DANGEROUS

// ✅ AFTER
const div = document.createElement('div');
div.textContent = userInput; // Safe
// OR use escapeHtml() function from db-secure.js
```

**Prevention**:
- Use `textContent` instead of `innerHTML`
- Use `escapeHtml()` for dynamic HTML
- Implement Content Security Policy (CSP)

---

### ✅ 3. Secure Token Storage
**Problem**: JWT stored in localStorage (accessible to XSS)
```javascript
// ❌ BEFORE
localStorage.setItem('lm_jwt', token);

// ✅ AFTER
sessionStorage.setItem('lm_jwt_secure', token); // Cleared on tab close
// Use httpOnly cookies for production
```

**Best Practices**:
- Use `sessionStorage` instead of `localStorage`
- In production: Use httpOnly, Secure cookies
- Never expose tokens in URLs or localStorage

---

### ✅ 4. CSRF (Cross-Site Request Forgery) Protection
**Problem**: No CSRF token validation
```javascript
// ✅ ADDED
X-CSRF-Token header validation
```

**Implementation**:
- Generate random CSRF tokens
- Validate on every state-changing request (POST, PUT, DELETE)
- Store in sessionStorage

---

### ✅ 5. Input Validation
**Problem**: No validation of email, password, phone
```javascript
// ✅ ADDED
class InputValidator {
  static validateEmail(email)
  static validatePassword(password)
  static validatePhone(phone)
  static validateName(name)
}
```

**Rules**:
- Email: RFC 5322 compliant
- Password: Min 8 chars, numbers, letters, symbols
- Phone: International format (+7XXXXXXXXXX)
- Max length enforcement

---

### ✅ 6. Rate Limiting
**Problem**: No protection against brute force
```javascript
// ✅ ADDED
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // 5 attempts per minute
});
```

**Limits**:
- Auth endpoints: 5 requests/minute
- General API: 30 requests/minute
- Global: 100 requests/15 minutes

---

### ✅ 7. CORS Hardening
**Problem**: CORS too permissive
```javascript
// ❌ BEFORE
origin: ['http://localhost:5500', ...],

// ✅ AFTER
origin: process.env.FRONTEND_URL || 'https://kbb001.github.io',
credentials: true,
allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
```

---

### ✅ 8. Security Headers (Helmet.js)
**Problem**: Missing security headers
```javascript
// ✅ ADDED
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
  },
}));
```

**Headers Added**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security

---

### ✅ 9. Payload Size Limit
**Problem**: No limit on request body
```javascript
// ✅ ADDED
app.use(express.json({ limit: '10kb' }));
```

**Protection**: Prevents DoS attacks with large payloads

---

### ✅ 10. Data Sanitization
**Problem**: No NoSQL/SQL injection protection
```javascript
// ✅ ADDED
const mongoSanitize = require('mongo-sanitize');
app.use(mongoSanitize());
```

**Prevents**: injection of malicious JavaScript objects

---

## Usage Guide

### For Frontend
```javascript
// Use secure version
<script src="db-secure.js"></script>
<script src="site-secure.js"></script>

// Input validation before sending
const result = await register(name, email, password, phone);
if (result.error) {
  console.error(result.error);
  toast(result.error, '⚠️');
}
```

### For Backend
```bash
# Install security packages
npm install helmet express-rate-limit mongo-sanitize hpp

# Use secure server
node server-secure.js

# Rename old files
mv server.js server-old.js
mv db.js db-old.js
mv site.js site-old.js
```

### Environment Setup
```bash
# Copy example
cp .env.example .env

# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with the generated secret
JWT_SECRET=your_generated_secret_here
```

---

## Deployment Checklist

- [ ] **Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Generate new `JWT_SECRET`
  - [ ] Set `FRONTEND_URL` to your domain
  - [ ] Use environment variables for all secrets

- [ ] **HTTPS**
  - [ ] Install SSL certificate
  - [ ] Enable HSTS headers
  - [ ] Redirect HTTP to HTTPS

- [ ] **Database**
  - [ ] Use strong database password
  - [ ] Enable database encryption
  - [ ] Regular backups
  - [ ] Use connection pooling

- [ ] **Monitoring**
  - [ ] Set up error tracking (Sentry)
  - [ ] Enable access logs
  - [ ] Monitor rate limit hits
  - [ ] Set up alerts for security events

- [ ] **Dependencies**
  - [ ] Run `npm audit`
  - [ ] Fix vulnerabilities
  - [ ] Keep packages updated
  - [ ] Use package-lock.json

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
secrets/
```

### 2. Use HTTPS Everywhere
- In production, always use HTTPS
- Set Secure flag on cookies
- Enable HSTS (Strict-Transport-Security)

### 3. Regular Security Audits
```bash
# Weekly
npm audit
npm audit fix

# Monthly
# Review dependency updates
# Check for CVEs
# Update packages
```

### 4. Error Handling
- Don't expose stack traces in production
- Log errors securely
- Monitor error patterns

### 5. Access Control
- Implement role-based access (RBAC)
- Validate user permissions on backend
- Never trust client-side role checks

### 6. Data Protection
- Encrypt sensitive data
- Implement PII masking
- Use GDPR-compliant data deletion
- Regular data backups

---

## Incident Response

If you suspect a security breach:

1. **Immediate Actions**
   - Rotate all secrets and API keys
   - Check access logs
   - Notify affected users

2. **Investigation**
   - Review logs for suspicious activity
   - Check for unauthorized access
   - Identify compromised data

3. **Remediation**
   - Apply security patches
   - Reset user passwords
   - Implement additional monitoring

4. **Post-Incident**
   - Document lessons learned
   - Update security policies
   - Conduct security training

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## Support

For security issues:
- Report privately to the repository owner
- Do not open public issues with security details
- Allow time for response before public disclosure

Last Updated: 2026-06-07
