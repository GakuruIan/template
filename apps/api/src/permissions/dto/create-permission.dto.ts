import { IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*:([a-z][a-z0-9_]*|\*)$/)
  key!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
