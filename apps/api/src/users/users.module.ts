import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'send-mail' })],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
