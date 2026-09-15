import {
  IsBoolean,
  IsBooleanString,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum InvitationStatusDto {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  token!: string;
}

export class UpdateInvitationDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsEnum(InvitationStatusDto)
  status?: InvitationStatusDto;

  @IsOptional()
  @IsBoolean()
  used?: boolean;

  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @IsOptional()
  @IsDateString()
  usedAt?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class AcceptInvitationDto {
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}

export class RevokeInvitationDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  revokedById?: string;
}

export class ListInvitationsQueryDto {
  @IsOptional()
  @IsEnum(InvitationStatusDto)
  status?: InvitationStatusDto;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsBooleanString()
  used?: string;

  @IsOptional()
  @IsString()
  invitedById?: string;

  @IsOptional()
  @IsString()
  revokedById?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
