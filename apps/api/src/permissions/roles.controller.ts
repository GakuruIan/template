import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-session.type';
import { Permissions } from './decorators/permissions.decorator';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsService } from './permissions.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('roles:view')
  listRoles() {
    return this.permissionsService.listRoles();
  }

  @Post()
  @Permissions('roles:create')
  createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    return this.permissionsService.createRole(dto, user.id);
  }

  @Get(':id')
  @Permissions('roles:view')
  getRole(@Param('id') id: string) {
    return this.permissionsService.getRole(id);
  }

  @Patch(':id')
  @Permissions('roles:update')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.permissionsService.updateRole(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('roles:delete')
  deleteRole(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.permissionsService.deleteRole(id, user.id);
  }

  @Post(':roleId/permissions')
  @Permissions('roles:update')
  addPermissionToRole(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.permissionsService.addPermissionToRole(
      roleId,
      dto.permissionId,
      user.id,
    );
  }

  @Get(':roleId/permissions')
  @Permissions('roles:view')
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.permissionsService.getRolePermissions(roleId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @Permissions('roles:update')
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.permissionsService.removePermissionFromRole(
      roleId,
      permissionId,
      user.id,
    );
  }

  @Patch('users/:userId')
  @Permissions('roles:update')
  assignUserRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.permissionsService.assignUserRole(userId, dto.roleId, user.id);
  }
}
