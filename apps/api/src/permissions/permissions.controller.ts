import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-session.type';
import { Permissions } from './decorators/permissions.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('permissions:view')
  listPermissions() {
    return this.permissionsService.listPermissions();
  }

  @Post()
  @Permissions('permissions:create')
  createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.permissionsService.createPermission(dto, user.id);
  }

  @Delete(':id')
  @Permissions('permissions:delete')
  deletePermission(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.permissionsService.deletePermission(id, user.id);
  }
}
