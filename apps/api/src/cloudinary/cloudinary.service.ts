import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private async uploadStream(
    file: Express.Multer.File,
    options?: { folder: string; media_type: 'image' | 'raw' },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `market-square/${options?.folder}`,
            resource_type: options?.media_type ?? 'image',
            transformation:
              options?.media_type === 'image'
                ? [
                    { width: 500, height: 500, crop: 'fill' },
                    { quality: 'auto' },
                  ]
                : undefined,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result as UploadApiResponse);
            }
          },
        )
        .end(file.buffer);
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    options?: { folder: string; media_type: 'image' | 'raw' },
  ): Promise<UploadApiResponse> {
    try {
      return await this.uploadStream(file, options);
    } catch (error) {
      console.log(`[CLOUDINARY]: ${error.message}`);
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  async uploadImages(
    files: Express.Multer.File[],
    options?: { folder: string; media_type: 'image' | 'raw' },
  ): Promise<UploadApiResponse[]> {
    try {
      const uploads = files.map((file) => this.uploadStream(file, options));

      return await Promise.all(uploads);
    } catch (error) {
      console.error('[CLOUDINARY]: Error uploading multiple images', error);
      throw new BadRequestException('Failed to upload multiple images');
    }
  }

  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new BadRequestException('Failed to delete image in Cloudinary');
    }
  }
}
