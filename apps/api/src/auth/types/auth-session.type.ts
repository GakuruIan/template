import type { Request } from 'express';
import { auth } from 'src/auth';

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession['user'] & {
  roleId?: string | null;
  role?: { id: string; name: string } | null;
  permissions?: string[];
  branchId?: string | null;
};

export type AuthenticatedRequest = Request & {
  session?: AuthSession;
  user?: AuthUser;
};
