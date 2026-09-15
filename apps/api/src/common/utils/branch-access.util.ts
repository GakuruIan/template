import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from 'src/auth/types/auth-session.type';

const branchSwitcherRoles = new Set([
  'platform admin',
  'platform_admin',
  'owner',
]);

const fixedBranchRoles = new Set(['manager', 'admin']);

function roleName(user: AuthUser) {
  return user.role?.name?.trim().toLowerCase() ?? '';
}

export function canUserSwitchBranches(user: AuthUser) {
  return branchSwitcherRoles.has(roleName(user));
}

export function isFixedBranchUser(user: AuthUser) {
  return fixedBranchRoles.has(roleName(user));
}

export function getAuthorizedBranchScope(user: AuthUser) {
  if (canUserSwitchBranches(user)) {
    return undefined;
  }

  if (isFixedBranchUser(user)) {
    if (!user.branchId) {
      throw new ForbiddenException('No branch is assigned to this user');
    }

    return user.branchId;
  }

  throw new ForbiddenException('This user cannot access branch-scoped data');
}

export function resolveAuthorizedBranchId(
  user: AuthUser,
  requestedBranchId?: string | null,
): string {
  if (canUserSwitchBranches(user)) {
    if (!requestedBranchId) {
      throw new ForbiddenException('Branch is required');
    }

    return requestedBranchId;
  }

  const assignedBranchId = getAuthorizedBranchScope(user);

  if (!assignedBranchId) {
    throw new ForbiddenException('Branch is required');
  }

  if (requestedBranchId && requestedBranchId !== assignedBranchId) {
    throw new ForbiddenException('You cannot access this branch');
  }

  return assignedBranchId;
}

export function assertCanAccessBranch(user: AuthUser, branchId: string) {
  resolveAuthorizedBranchId(user, branchId);
}
