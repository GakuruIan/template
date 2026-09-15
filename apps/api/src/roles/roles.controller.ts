import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesService } from './roles.service';
import {
  CreateRoleDto,
  SyncRolePermissionsDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/auth/types/auth-session.type';

import { Permissions } from 'src/permissions/decorators/permissions.decorator';

type Cursor = {
  id: string;
};

@Controller('roles')
@UseGuards(AuthGuard)
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post('/create')
  @Permissions('roles:create')
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    return this.roleService.create(dto, user.id);
  }

  @Patch(':id/update')
  @Permissions('roles:update')
  async update(
    @Body() data: UpdateRoleDto,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleService.update(id, data, user.id);
  }

  @Get('/list')
  @Permissions('roles:view')
  async list(
    @Query('cursorId') cursorId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const cursor: Cursor | undefined = cursorId ? { id: cursorId } : undefined;
    return this.roleService.list(limit, cursor);
  }

  @Get('/slug/:slug')
  @Permissions('roles:view')
  async getBySlug(@Param('slug') slug: string) {
    return this.roleService.getBySlug(slug);
  }

  @Put(':id/permissions')
  @Permissions('roles:update')
  async syncPermissions(
    @Param('id') id: string,
    @Body() dto: SyncRolePermissionsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleService.syncPermissions(id, dto.permissionIds, user.id);
  }

  @Patch(':id/delete')
  @Permissions('roles:delete')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.roleService.delete(id, user.id);
  }

  @Patch(':id/restore')
  @Permissions('roles:restore')
  async restore(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.roleService.restore(id, user.id);
  }
}
