import { IsString } from 'class-validator';

export class AssignPermissionDto {
  @IsString()
  permissionId!: string;
}
