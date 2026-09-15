import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Status } from 'database';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRoleDto {
  @Transform(trimString)
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class UpdateRoleDto {
  @IsOptional()
  @Transform(trimString)
  @Length(4, 100)
  name?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class SyncRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds!: string[];
}
