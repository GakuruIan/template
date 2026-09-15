import { Prisma } from 'database';

export function isKnownPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return isKnownPrismaError(error) && error.code === 'P2002';
}

export function isUniqueTargetError(error: unknown, targetName: string) {
  if (!isUniqueConstraintError(error)) {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.includes(targetName)
    : typeof target === 'string' && target.includes(targetName);
}

export function isUniqueCodeCollision(error: unknown) {
  return isUniqueTargetError(error, 'code');
}

export function isRecordNotFoundError(error: unknown) {
  return isKnownPrismaError(error) && error.code === 'P2025';
}

export function isValidationError(
  error: unknown,
): error is Prisma.PrismaClientValidationError {
  return error instanceof Prisma.PrismaClientValidationError;
}

export function isForeignKeyError(error: unknown) {
  return isKnownPrismaError(error) && error.code === 'P2003';
}
