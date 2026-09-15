import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  exports: [CloudinaryService],
  providers: [CloudinaryService],
})
export class CloudinaryModule {}
