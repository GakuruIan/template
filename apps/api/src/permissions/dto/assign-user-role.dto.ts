import { IsString } from 'class-validator';

export class AssignUserRoleDto {
  @IsString()
  roleId!: string;
}
