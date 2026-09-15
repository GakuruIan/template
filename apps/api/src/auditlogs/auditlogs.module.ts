import { Module } from '@nestjs/common';
import { AuditlogsService } from './auditlogs.service';
import { AuditlogsController } from './auditlogs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditlogsService],
  controllers: [AuditlogsController],
})
export class AuditlogsModule {}
