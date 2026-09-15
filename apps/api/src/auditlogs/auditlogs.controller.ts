import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuditlogsService } from './auditlogs.service';
import { Permissions } from 'src/permissions/decorators/permissions.decorator';

type Cursor = {
  id: string;
};

@Controller('auditlogs')
export class AuditlogsController {
  constructor(private readonly auditlogsService: AuditlogsService) {}
  @UseGuards(AuthGuard)
  @Permissions('auditlogs:view')
  @Get('/list')
  async list(
    @Query('cursorId') cursorId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const cursor: Cursor | undefined = cursorId ? { id: cursorId } : undefined;
    return this.auditlogsService.list(limit, cursor);
  }
}
