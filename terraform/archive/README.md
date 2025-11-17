# Terraform Archive

This directory contains archived Terraform files that are no longer actively used but preserved for historical reference.

## Contents

### Terraform Plan Files (`.tfplan`)
Temporary planning outputs from `terraform plan` commands. These are snapshots from various infrastructure changes and are kept for troubleshooting reference.

- **minimal-staging.tfplan** - Initial minimal staging deployment
- **minimal-staging-v2.tfplan** - Updated minimal staging config
- **production.tfplan** - Production environment plan
- **staging.tfplan** - Standard staging plan
- **vpc-endpoints.tfplan** - Plan for VPC endpoints (before removal)
- **tfplan*** - Various other planning snapshots

### State Backups
- **terraform.tfstate.1762994687.backup** - Old state backup (Nov 13)

### Disabled Infrastructure
- **vpc-endpoints.tf.disabled** - VPC endpoints configuration (removed Nov 17 to save $29/month)

### Documentation (Outdated)
- **AWS_RESOURCES.md** - Point-in-time AWS resource inventory from Nov 4
- **COST_COMPARISON.md** - Cost analysis from Nov 4 (pre-VPC endpoint removal)

## Why These Files Were Archived

1. **Terraform plans** are temporary and become stale after applying changes
2. **Old state backups** are superseded by newer backups
3. **Disabled configs** are preserved in case we need to re-enable features
4. **Outdated docs** contain infrastructure snapshots that no longer match reality

## Restoration

If you need to reference or restore any of these files:

```bash
# View archived file
cat archive/filename

# Restore a file (if needed)
mv archive/filename ./
```

---

**Last Updated**: 2025-11-17
