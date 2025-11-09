# Admin User Provisioning Guide

> **Security Note**: This application uses **invite-only user provisioning**. Users cannot self-register. All accounts must be created by administrators.

---

## Environments

**Current Status**: Production environment only (as of v1.0 MVP)

### Production
- **User Pool ID**: `ap-southeast-2_v2Jk8B9EK`
- **Region**: `ap-southeast-2` (Sydney)
- **Purpose**: Live user accounts
- **Login URL**: https://dtfaaynfdzwhd.cloudfront.net/login (staging) or production URL when deployed

> **Note**: Staging environment uses the same Cognito pool as production. Separate pools may be added in future releases.

---

## Overview

The Embark Quoting System is a company-internal tool. User accounts are provisioned by administrators using AWS CLI or AWS Console. There is no public signup interface.

### User Roles

1. **Super Admin** - Can create users, assign roles, manage all quotes and pricing
2. **Admin** - Can manage pricing, view all quotes, cannot manage users
3. **Field Worker** - Can create/edit quotes, cannot manage pricing or users

---

## Method 1: AWS CLI (Recommended for Automation)

### Prerequisites

```bash
# Install AWS CLI if not already installed
# See: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Configure AWS credentials
aws configure
```

### Create a New User

#### Step 1: Create the User

```bash
# Replace with actual email and desired temporary password
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --user-attributes Name=email,Value=user@embarkearth.com.au \
                     Name=email_verified,Value=true \
                     Name=custom:role,Value=field_worker \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --region ap-southeast-2
```

**Parameters:**
- `--user-pool-id`: The Cognito User Pool ID (from Terraform output)
- `--username`: User's email address
- `--user-attributes`:
  - `email`: User's email
  - `email_verified`: Set to `true` to skip email verification
  - `custom:role`: One of `field_worker`, `admin`, or `super_admin`
- `--temporary-password`: Initial password (user must change on first login)
- `--message-action SUPPRESS`: Don't send automatic email (we'll send custom onboarding email)

#### Step 2: Add User to Cognito Group

```bash
# For field workers
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --group-name field_workers \
  --region ap-southeast-2

# For admins
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username admin@embarkearth.com.au \
  --group-name admins \
  --region ap-southeast-2
```

#### Step 3: Send Onboarding Email (Manual)

Send the user an email with:
- Login URL: `https://your-domain.com/login` (or ALB URL)
- Username: Their email address
- Temporary password: The password you set in Step 1
- Instructions: "You'll be prompted to set a permanent password on first login"

---

## Method 2: AWS Console (Manual GUI)

### Step 1: Navigate to Cognito

1. Open AWS Console → Services → Cognito
2. Select "embark-quoting-users" User Pool
3. Click "Users" in the left sidebar
4. Click "Create user"

### Step 2: Create User Form

Fill in the form:
- **Email**: User's email address
- **Mark email as verified**: ✅ Checked
- **Send invitation**: ❌ Unchecked (we'll send custom email)
- **Temporary password**: Set a strong temporary password

Click "Create user".

### Step 3: Set Custom Attribute

1. Find the newly created user in the user list
2. Click on the user's email
3. Scroll to "Attributes" section
4. Click "Edit"
5. Add custom attribute:
   - **Name**: `custom:role`
   - **Value**: `field_worker` or `admin`
6. Click "Save changes"

### Step 4: Add to Group

1. Still on the user detail page, scroll to "Group memberships"
2. Click "Add user to group"
3. Select `field_workers` or `admins`
4. Click "Add"

### Step 5: Send Onboarding Email

Send the user an email (same as CLI method step 3).

---

## Method 3: Automated Provisioning Script (Future)

**Status**: Not yet implemented
**Tracking**: Will be implemented as part of Epic 6 (Administration Interface)

Future script will:
1. Take CSV of users: `email,role`
2. Automatically create all users with generated temp passwords
3. Send onboarding emails via SES
4. Log results to CloudWatch

---

## User First Login Flow

### What the User Experiences

1. **Visit login page**: `https://your-domain.com/login`
2. **Enter credentials**:
   - Email: Their email address
   - Password: Temporary password from onboarding email
3. **AWS Cognito Challenge**: "New password required"
4. **Set permanent password**:
   - Must be 8+ characters
   - Must have uppercase letter
   - Must have lowercase letter
   - Must have number
5. **Automatic login**: After password change, user is logged in and redirected to dashboard

### Technical Implementation

The frontend handles the "new password required" flow via:
```typescript
// src/features/auth/authService.ts
cognitoUser.authenticateUser(authenticationDetails, {
  onSuccess: (result) => { /* ... */ },
  onFailure: (err) => { /* ... */ },
  newPasswordRequired: () => {
    // TODO: Implement new password UI
    // Currently rejects with error message
  }
});
```

**Note**: The `newPasswordRequired` callback currently needs implementation. For now, users will see an error message. This will be implemented in a future task.

---

## Managing Existing Users

### Change User Role

```bash
# Update custom:role attribute
aws cognito-idp admin-update-user-attributes \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --user-attributes Name=custom:role,Value=admin \
  --region ap-southeast-2

# Move user to different group
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --group-name field_workers \
  --region ap-southeast-2

aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --group-name admins \
  --region ap-southeast-2
```

### Disable User (Without Deleting)

```bash
aws cognito-idp admin-disable-user \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --region ap-southeast-2
```

### Re-enable User

```bash
aws cognito-idp admin-enable-user \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --region ap-southeast-2
```

### Delete User (Permanent)

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --region ap-southeast-2
```

### Reset User Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username user@embarkearth.com.au \
  --password "NewTempPass123!" \
  --permanent false \
  --region ap-southeast-2
```

**Note**: With `--permanent false`, the user will be forced to change password on next login.

---

## Bulk Operations

### List All Users

```bash
aws cognito-idp list-users \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --region ap-southeast-2 \
  --output table
```

### List Users in Specific Group

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --group-name field_workers \
  --region ap-southeast-2 \
  --output table
```

### Export User List to CSV

```bash
aws cognito-idp list-users \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --region ap-southeast-2 \
  --query 'Users[*].[Username,Attributes[?Name==`email`].Value|[0],Attributes[?Name==`custom:role`].Value|[0],UserStatus]' \
  --output text > users.csv
```

---

## Security Best Practices

### 1. Strong Temporary Passwords
Generate random passwords for new users:
```bash
openssl rand -base64 12
```

### 2. Audit Trail
All admin operations are logged in CloudWatch. Review regularly:
```bash
aws logs filter-log-events \
  --log-group-name /aws/cognito/userpools/ap-southeast-2_v2Jk8B9EK \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --region ap-southeast-2
```

### 3. Principle of Least Privilege
- Start users as `field_worker` by default
- Only promote to `admin` when necessary
- `super_admin` role should be extremely limited (1-2 people)

### 4. Regular Access Reviews
- Quarterly: Review all active users
- Remove users who have left the company
- Audit role assignments for appropriateness

### 5. Multi-Factor Authentication (MFA)
**Status**: Currently `OPTIONAL` in Cognito configuration
**Recommendation**: Make MFA `REQUIRED` for all `admin` and `super_admin` users

To enable MFA for a specific user:
```bash
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username admin@embarkearth.com.au \
  --software-token-mfa-settings Enabled=true,PreferredMfa=true \
  --region ap-southeast-2
```

---

## Troubleshooting

### Issue: "User does not exist"
- Check the username is the user's email address
- Verify you're using the correct User Pool ID
- Confirm you're in the correct AWS region (`ap-southeast-2`)

### Issue: "Cannot assign custom:role attribute"
- Ensure the attribute exists in User Pool schema (check Terraform configuration)
- Verify the attribute name is exactly `custom:role` (case-sensitive)
- Check that the User Pool Client has `custom:role` in `read_attributes`

### Issue: User can't log in after creation
- Verify user status is `CONFIRMED` (not `FORCE_CHANGE_PASSWORD`)
- Check user is in the correct Cognito group
- Ensure `custom:role` attribute is set
- Verify email is marked as verified

### Issue: User receives "Not authorized" error
- Check user's Cognito group membership
- Verify `custom:role` attribute matches their group
- Check backend API authorization logic (if implemented)

---

## Future Enhancements

### Epic 6: Administration Interface (Planned)

A web-based admin panel will provide:
- GUI for creating/managing users (no AWS CLI needed)
- Bulk user import via CSV
- Role assignment interface
- Activity logs and audit trails
- User search and filtering
- Email template customization

**Timeline**: After Epic 5 (Sync Engine) is complete
**Tracking**: See `specs/BLUEPRINT.yaml` → Epic 6

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-04 | Initial version - AWS CLI and Console methods | Claude |
| 2025-11-04 | Added security best practices and troubleshooting | Claude |

---

## Related Documentation

- [Cognito Terraform Configuration](../infrastructure/terraform/cognito.tf)
- [Frontend Authentication](../frontend/src/features/auth/README.md) (if exists)
- [AWS Cognito User Pool Administration Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users.html)
