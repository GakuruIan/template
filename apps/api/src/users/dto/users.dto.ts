import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export enum UserRoleNameDto {
  PLATFORM_ADMIN = 'Platform Admin',
  OWNER = 'Owner',
  MANAGER = 'Manager',
  CASHIER = 'Cashier',
}

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
