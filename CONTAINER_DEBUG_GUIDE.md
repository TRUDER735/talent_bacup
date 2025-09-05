# Container Debug Guide - Production Signup Issues

## Overview
This guide helps debug container exits during the signup process in production environments.

## Common Container Exit Causes

### 1. Unhandled Promise Rejections
**Symptoms**: Container exits silently after starting signup process
**Root Cause**: Database timeouts, email service failures, or network issues causing unhandled rejections

**Debug Steps**:
```bash
# Check container logs for unhandled rejections
docker logs <container_id> 2>&1 | grep -i "unhandled"

# Monitor container resource usage
docker stats <container_id>
```

### 2. Database Connection Issues
**Symptoms**: Container exits after "Creating new employer user" log
**Root Cause**: MongoDB connection timeouts, network issues, or invalid credentials

**Debug Steps**:
```bash
# Test database connectivity from container
docker exec -it <container_id> node -e "
const { MongoClient } = require('mongodb');
MongoClient.connect(process.env.DB_URI)
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.error('❌ DB Error:', err.message));
"

# Check environment variables
docker exec -it <container_id> env | grep -E "(DB_|MONGO)"
```

### 3. Email Service Failures
**Symptoms**: Container exits during OTP sending process
**Root Cause**: Missing email credentials, API rate limits, or network issues

**Debug Steps**:
```bash
# Check email environment variables
docker exec -it <container_id> env | grep -E "(EMAIL_|SMTP_|RE_SEND)"

# Test email service connectivity
docker exec -it <container_id> node -e "
fetch('https://api.resend.com/domains', {
  headers: { 'Authorization': 'Bearer ' + process.env.RE_SEND_PASS }
}).then(r => console.log('✅ Email API:', r.status))
.catch(e => console.error('❌ Email Error:', e.message));
"
```

## Enhanced Error Handling (Implemented)

### 1. Process-Level Error Handlers
- Added `unhandledRejection` handler to prevent container crashes
- Added `uncaughtException` handler with production-safe logging
- Graceful error logging without process termination in production

### 2. Database Operation Timeouts
- All database operations now have 10-15 second timeouts
- Enhanced error logging for database failures
- Graceful fallback handling for connection issues
- Applied to all services: Auth, Talent, and Employer

### 3. Email Service Resilience
- OTP generation and storage before email sending
- Timeout protection for email operations (30 seconds)
- Graceful degradation when email service is unavailable
- Enhanced error messages for different failure types

### 4. Authentication Flow Improvements
- **Signup Flow**: Step-by-step error tracking with user creation flags
- **Signin Flow**: Timeout protection for user lookup, password verification, and token generation
- **OTP Verification**: Enhanced error handling for verification and user updates
- Partial success handling (user created but email failed)
- Enhanced logging for production debugging
- Specific error messages for different failure scenarios

### 5. Service-Level Enhancements
- **TalentService**: Timeout protection for createTalent, findByEmail, and update operations
- **EmployerService**: Timeout protection for createEmployer, findByEmail operations
- **AuthService**: Comprehensive error handling for all authentication flows
- Explicit `isEmailVerified: false` setting for new users

## Production Monitoring Commands

### Check Container Health
```bash
# Container status
docker ps -a | grep talent_api

# Container resource usage
docker stats --no-stream <container_id>

# Container logs (last 100 lines)
docker logs --tail 100 <container_id>

# Follow live logs
docker logs -f <container_id>
```

### Debug Specific Issues
```bash
# Database connectivity test
docker exec -it <container_id> node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI)
  .then(() => { console.log('✅ MongoDB Connected'); process.exit(0); })
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });
"

# Email service test
docker exec -it <container_id> node -e "
const nodemailer = require('nodemailer');
console.log('Email Config:', {
  host: process.env.SMTP_HOST,
  user: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
  pass: process.env.RE_SEND_PASS ? '✅ Set' : '❌ Missing',
  from: process.env.EMAIL_FROM
});
"

# Environment variables check
docker exec -it <container_id> env | sort
```

### Application Health Checks
```bash
# Health endpoint
curl http://localhost:4001/talent/health

# API status
curl -X POST http://localhost:4001/talent/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"employer"}' \
  -v
```

## Environment Variables Checklist

### Required for Production
- `DB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV=production`
- `APP_PORT=4001`

### Required for Email (Optional but recommended)
- `RE_SEND_PASS` - Resend API key
- `EMAIL_FROM` - From email address
- `SMTP_HOST` - SMTP server (if using SMTP)
- `SMTP_USER` - SMTP username (if using SMTP)

### Optional
- `ALLOWED_ORIGINS` - CORS origins
- `GOOGLE_CLIENT_ID` - Google OAuth (if used)

## Troubleshooting Steps

### 1. Container Exits During Signup
1. Check logs for the last error message
2. Verify database connectivity
3. Test email service configuration
4. Check resource limits (memory/CPU)
5. Verify environment variables are set

### 2. Database Timeout Issues
1. Check MongoDB server status
2. Verify network connectivity to database
3. Check connection string format
4. Monitor database server resources
5. Consider increasing timeout values

### 3. Email Service Issues
1. Verify API keys are correct
2. Check rate limits on email service
3. Test API connectivity manually
4. Review email service logs
5. Consider fallback email providers

## Recovery Actions

### Immediate Actions
```bash
# Restart container
docker restart <container_id>

# Check container health
docker exec -it <container_id> curl http://localhost:4001/talent/health

# Monitor logs
docker logs -f <container_id>
```

### If Issues Persist
1. Check GitHub repository secrets
2. Verify CI/CD pipeline environment variables
3. Test with minimal configuration
4. Enable debug logging
5. Contact development team with logs

## Log Analysis

### Key Log Patterns to Look For
- `❌ Unhandled Rejection` - Process-level errors
- `❌ Database error` - Database connectivity issues
- `❌ Failed to send OTP` - Email service problems
- `❌ Signup failed` - General signup process errors
- `❌ Signin failed` - General signin process errors
- `❌ OTP verification process failed` - OTP verification errors
- `Database operation timeout` - Database timeout issues
- `Email service timeout` - Email service timeout issues
- `User lookup timeout` - Database query timeout during authentication
- `Password comparison timeout` - bcrypt timeout issues
- `Token generation timeout` - JWT generation timeout

### Successful Authentication Flow Logs

**Signup Flow:**
```
🔍 Starting signup process for email@example.com with role employer
🔍 Checking if employer exists with email: email@example.com
👤 Creating new employer user with email: email@example.com
✅ User created successfully: email@example.com
📧 Attempting to send OTP to email@example.com for verification
✅ OTP sent successfully to email@example.com
```

**Signin Flow:**
```
🔍 Starting signin process for email@example.com
🔍 Looking up user: email@example.com
🔍 User lookup result: found
🔐 Verifying password for user: email@example.com
✅ Password verified for user: email@example.com
🎫 Generating token for user: email@example.com
✅ Signin successful for user: email@example.com
```

**OTP Verification Flow:**
```
🔍 Starting OTP verification for email@example.com
✅ OTP verified for email@example.com
🔍 Looking up user for verification: email@example.com
🔄 Updating verification status for email@example.com
✅ Email verification completed for email@example.com
```

## Prevention Measures

1. **Health Checks**: Regular container health monitoring
2. **Resource Limits**: Proper memory and CPU limits
3. **Timeout Configuration**: Appropriate timeout values
4. **Error Monitoring**: Centralized error logging
5. **Backup Plans**: Fallback mechanisms for critical services
