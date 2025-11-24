# Refresh Token Management System

## Overview

Comprehensive refresh token management system implemented to prevent token accumulation, enhance security, and provide better session control.

## Problems Solved

### Before Implementation
1. ❌ **Token Accumulation** - Every login created new tokens without deleting old ones
2. ❌ **No Cleanup** - Expired tokens stayed in database forever
3. ❌ **No Token Rotation** - Refresh tokens never changed, security risk
4. ❌ **Unlimited Sessions** - Users could have infinite active sessions
5. ❌ **Hardcoded Values** - Token expiration hardcoded instead of using env vars
6. ❌ **No Logout All** - No way to revoke all user sessions

### After Implementation
1. ✅ **Automated Cleanup** - Cron job deletes expired tokens daily
2. ✅ **Token Rotation** - New refresh token issued on every refresh
3. ✅ **Session Limits** - Maximum 5 active sessions per user (configurable)
4. ✅ **Reuse Detection** - Detects token theft attempts
5. ✅ **Environment Configuration** - All values configurable via .env
6. ✅ **Logout All Devices** - Users can invalidate all sessions

---

## Implementation Details

### 1. Environment Variables

**File:** `src/config/env.ts`

```typescript
// Session Management
MAX_ACTIVE_SESSIONS_PER_USER: 5 (default)

// Token Cleanup Cron Job
TOKEN_CLEANUP_CRON_SCHEDULE: '0 2 * * *' (daily at 2 AM)
ENABLE_TOKEN_CLEANUP_JOB: true (default)
```

**Add to `.env` file (optional):**
```env
MAX_ACTIVE_SESSIONS_PER_USER=5
TOKEN_CLEANUP_CRON_SCHEDULE=0 2 * * *
ENABLE_TOKEN_CLEANUP_JOB=true
```

---

### 2. Login Flow Changes

**File:** `src/services/auth.service.ts`

**New Behavior:**
1. User logs in
2. System deletes expired tokens for this user
3. System checks active session count
4. If user has 5+ sessions, oldest sessions are deleted
5. New refresh token created and saved
6. Max 5 active sessions maintained

**Code Highlights:**
- Uses `calculateTokenExpiration()` helper to parse env values (7d, 24h, etc.)
- Enforces session limit before creating new token
- Cleans up expired tokens on every login

---

### 3. Token Rotation (Refresh Flow)

**File:** `src/services/auth.service.ts`

**Old Behavior:**
- Validate refresh token
- Return new access token
- Keep same refresh token ❌

**New Behavior:**
1. Validate refresh token
2. Generate NEW access token
3. Generate NEW refresh token
4. Delete old refresh token (atomic transaction)
5. Save new refresh token
6. Return both new tokens ✅

**Reuse Detection:**
If a deleted (already-used) token is presented:
- System invalidates ALL user tokens
- Prevents token theft attacks

---

### 4. Automated Cleanup Cron Job

**File:** `src/jobs/tokenCleanup.job.ts`

**Features:**
- Runs on configurable schedule (default: daily at 2 AM)
- Deletes all expired refresh tokens from database
- Logs number of tokens deleted
- Can be manually triggered for testing
- Graceful start/stop with server lifecycle

**Usage:**
```typescript
import { tokenCleanupJob } from './jobs';

// Manual cleanup (for testing)
const deletedCount = await tokenCleanupJob.cleanup();
console.log(`Deleted ${deletedCount} expired tokens`);
```

---

### 5. New API Endpoints

#### POST /auth/logout-all

**Purpose:** Logout from all devices

**Auth:** Required (Bearer token)

**Request:**
```http
POST /auth/logout-all
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Use Cases:**
- User suspects account compromise
- User changes password
- User wants to revoke all active sessions

---

#### GET /auth/sessions

**Purpose:** View active sessions

**Auth:** Required (Bearer token)

**Request:**
```http
GET /auth/sessions
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-1",
        "createdAt": "2025-11-22T10:00:00Z",
        "expiresAt": "2025-11-29T10:00:00Z"
      },
      {
        "id": "uuid-2",
        "createdAt": "2025-11-21T15:30:00Z",
        "expiresAt": "2025-11-28T15:30:00Z"
      }
    ]
  }
}
```

---

## Security Improvements

### 1. Token Rotation
- **Before:** Same refresh token used forever
- **After:** New refresh token on every refresh
- **Benefit:** Limits exposure window if token is stolen

### 2. Reuse Detection
- **Mechanism:** If deleted token is used, invalidate ALL user tokens
- **Protection:** Detects token theft/replay attacks
- **Response:** Forces user to re-login

### 3. Session Limits
- **Before:** Unlimited concurrent sessions
- **After:** Maximum 5 sessions (configurable)
- **Benefit:** Reduces attack surface

### 4. Automatic Cleanup
- **Before:** Expired tokens accumulate forever
- **After:** Daily cleanup job removes expired tokens
- **Benefit:** Prevents database bloat, improves query performance

---

## Database Impact

### Before Implementation
**Example:** 1,000 users, each logs in daily
- After 1 week: ~7,000 tokens in database
- After 1 month: ~30,000 tokens
- After 1 year: ~365,000 tokens (mostly expired!)

### After Implementation
**Same scenario with cleanup:**
- Max tokens per user: 5 active sessions
- Max total: ~5,000 tokens (all active)
- Expired tokens: Cleaned up daily at 2 AM

**Database Size Reduction:** ~98% fewer tokens!

---

## Configuration Reference

### Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7) (Sunday = 0 or 7)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

**Examples:**
- `0 2 * * *` - Daily at 2 AM (default)
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `*/30 * * * *` - Every 30 minutes

### Token Expiration Format

Supported formats: `7d`, `24h`, `60m`, `3600s`

**Examples:**
- `JWT_REFRESH_EXPIRES_IN=7d` - 7 days
- `JWT_REFRESH_EXPIRES_IN=24h` - 24 hours
- `JWT_REFRESH_EXPIRES_IN=60m` - 60 minutes
- `JWT_REFRESH_EXPIRES_IN=3600s` - 3600 seconds

---

## Testing

### 1. Test Token Rotation

```bash
# 1. Login
POST /auth/login
# Save accessToken1 and refreshToken1

# 2. Refresh
POST /auth/refresh
Body: { "refreshToken": "<refreshToken1>" }
# Get new accessToken2 and refreshToken2

# 3. Try to reuse old refresh token (should fail)
POST /auth/refresh
Body: { "refreshToken": "<refreshToken1>" }
# Expected: 401 Unauthorized
```

### 2. Test Session Limit

```bash
# Login 6 times with same user
# Check database - should only have 5 tokens
# Oldest token should be automatically deleted
```

### 3. Test Logout All

```bash
# 1. Login from multiple devices (get multiple tokens)
# 2. Call logout-all
POST /auth/logout-all
# 3. Try to refresh with any old token (should all fail)
```

### 4. Test Manual Cleanup

```typescript
import { tokenCleanupJob } from './src/jobs';

// Run cleanup manually
const count = await tokenCleanupJob.cleanup();
console.log(`Deleted ${count} expired tokens`);
```

---

## Files Modified

### Core Implementation
1. `src/config/env.ts` - Added environment variables
2. `src/services/auth.service.ts` - Token rotation, session limits, cleanup
3. `src/controllers/auth.controller.ts` - New endpoints (logout-all, sessions)
4. `src/routes/auth.routes.ts` - New routes with Swagger docs
5. `src/server.ts` - Start/stop cron jobs

### New Files
6. `src/jobs/tokenCleanup.job.ts` - Cleanup cron job
7. `src/jobs/index.ts` - Jobs registry

### Dependencies
8. `package.json` - Added node-cron, @types/node-cron

---

## Migration Guide

### For Existing Databases

No schema changes required! The implementation works with existing `refresh_tokens` table.

**Recommended Steps:**
1. Deploy new code
2. Run manual cleanup to remove existing expired tokens:
   ```typescript
   await tokenCleanupJob.cleanup();
   ```
3. Monitor logs for cron job execution
4. Verify old tokens are being rotated

---

## Monitoring

### Logs to Watch

```
✓ Starting token cleanup job with schedule: 0 2 * * *
✓ Token cleanup job started successfully
✓ Running token cleanup job...
✓ Token cleanup completed: 1247 expired tokens deleted
```

### Metrics to Track

1. **Token Count:** Total refresh tokens in database
2. **Cleanup Runs:** Successful/failed cleanup executions
3. **Tokens Deleted:** Number of expired tokens removed
4. **Average Sessions:** Average active sessions per user

---

## Troubleshooting

### Issue: Cron job not running

**Check:**
```typescript
// In logs, should see:
"Starting token cleanup job with schedule: 0 2 * * *"
"Token cleanup job started successfully"
```

**Solution:**
- Verify `ENABLE_TOKEN_CLEANUP_JOB=true` in .env
- Check cron schedule format is valid
- Manually trigger: `await tokenCleanupJob.cleanup()`

### Issue: Token rotation not working

**Check:**
- Login returns both `accessToken` and `refreshToken`
- Refresh returns NEW `refreshToken` (different from old one)
- Old refresh token can't be reused

**Debug:**
```typescript
// In refresh response, compare tokens:
console.log('Old refresh token:', oldRefreshToken);
console.log('New refresh token:', newRefreshToken);
// They should be different!
```

### Issue: Users getting logged out unexpectedly

**Possible Causes:**
1. Session limit too low (increase `MAX_ACTIVE_SESSIONS_PER_USER`)
2. Token expiration too short (check `JWT_REFRESH_EXPIRES_IN`)
3. Reuse detection triggered (user should change password)

---

## Future Enhancements

### Potential Improvements

1. **Device Information**
   - Store device info (browser, OS, IP)
   - Show in GET /auth/sessions
   - Allow selective logout by device

2. **Suspicious Activity Detection**
   - Track login locations
   - Alert on unusual login patterns
   - Automatic logout on suspicious activity

3. **Token Blacklist (Redis)**
   - Cache revoked tokens in Redis
   - Faster validation than database lookup
   - TTL matches token expiration

4. **Metrics Dashboard**
   - Active sessions per user
   - Token cleanup statistics
   - Session duration analytics

---

## API Documentation

All new endpoints are documented in Swagger UI:
- **Swagger URL:** `http://localhost:5000/api-docs`
- **New Endpoints:**
  - POST /auth/logout-all
  - GET /auth/sessions

Updated existing endpoint:
- POST /auth/refresh (now returns new refresh token)

---

## Summary

### ✅ Completed Features

1. ✅ Automated token cleanup (cron job)
2. ✅ Token rotation on refresh
3. ✅ Session limits per user
4. ✅ Logout all devices endpoint
5. ✅ View active sessions endpoint
6. ✅ Reuse detection for security
7. ✅ Environment configuration
8. ✅ Swagger documentation
9. ✅ Graceful shutdown handling

### 📊 Impact

- **Database:** ~98% reduction in token storage
- **Security:** Token rotation + reuse detection
- **User Control:** Logout all + view sessions
- **Performance:** No expired tokens slowing queries
- **Maintenance:** Fully automated cleanup

### 🎯 Result

**Problem:** Tokens were accumulating and never cleaned up.

**Solution:** Comprehensive token management with rotation, limits, and automated cleanup.

**Status:** ✅ **Production Ready**
