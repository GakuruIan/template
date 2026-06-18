import type { Request } from 'express';
import { auth } from 'src/auth';
import { Role } from 'database';

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession['user'] & {
  role?: Role;
};

export type AuthenticatedRequest = Request & {
  session?: AuthSession;
  user?: AuthUser;
};
