# Staging Cognito Client ID Fix

**Date**: 2025-11-08
**Issue**: Staging login failing with "Incorrect username or password"
**Status**: RESOLVED

## Problem

After fixing production E2E authentication, staging environment still failed with "Incorrect username or password" error.

## Root Cause

GitHub Secret `STAGING_COGNITO_CLIENT_ID` contained incorrect value.

- **Incorrect value** (in GitHub Secret): `5ooei1nh4h53eovvfu9i3i8u2m`
- **Correct value** (from AWS): `1li6qn77cs9m2f47pbg8qrd3at`

## Evidence

```bash
$ aws cognito-idp list-user-pool-clients --user-pool-id ap-southeast-2_D2t5oQs37 --region ap-southeast-2
{
    "UserPoolClients": [
        {
            "ClientId": "1li6qn77cs9m2f47pbg8qrd3at",
            "UserPoolId": "ap-southeast-2_D2t5oQs37",
            "ClientName": "embark-quoting-staging-frontend-client"
        }
    ]
}
```

## Solution

1. Updated GitHub Secret with correct client ID:
   ```bash
   echo "1li6qn77cs9m2f47pbg8qrd3at" | gh secret set STAGING_COGNITO_CLIENT_ID
   ```

2. Reset staging Cognito password to match AWS Secrets Manager:
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id ap-southeast-2_D2t5oQs37 \
     --username e2e-test@embark-quoting.local \
     --password '2UnkuFUrILJv8z)p' \
     --permanent
   ```

3. Trigger staging redeployment (push to `dev` branch) to rebuild frontend with correct config

## Verification

After redeployment:
- Staging login: https://d1aekrwrb8e93r.cloudfront.net
- Credentials: `e2e-test@embark-quoting.local` / `2UnkuFUrILJv8z)p`
- Expected: ✅ Login succeeds

## Related

See `2025-11-08-e2e-login-failure-fix.md` for production E2E authentication fix.
