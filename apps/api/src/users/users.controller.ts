import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-session.type';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { AuthGuard } from 'src/auth/auth.guard';

type Cursor = {
  id: string;
};

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('/create')
  @Permissions('users:create')
  create(@Body() data: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.userService.createUser(data, user.id);
  }

  @Patch(':id')
  @Permissions('users:update')
  update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.userService.updateUser(id, data, user.id);
  }

  @Get('/list')
  @Permissions('users:view')
  list(
    @Query('roleName') roleName?: string,
    @Query('excludeRoleName') excludeRoleName?: string,
    @Query('cursorId') cursorId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const cursor: Cursor | undefined = cursorId ? { id: cursorId } : undefined;

    return this.userService.listUsers(roleName, excludeRoleName, cursor, limit);
  }

  @Get('/options')
  @Permissions('users:view')
  listUserOptions(
    @Query('roleName') roleName?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.listUserOptions(roleName, search);
  }
}
