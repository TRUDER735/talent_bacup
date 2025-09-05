import { Controller, Post, Req, Res, Body, Param } from '@nestjs/common';
import { AwsService } from './aws.service';

@Controller('Awsprofile')
export class AwsController {
    constructor(private readonly awsService: AwsService) { }

    @Post(':userId/upload-image')
    async uploadProfileImage(@Param('userId') userId: string, @Body() file: Buffer) {
        const filename = `profile-${userId}-${Date.now()}.jpg`;
        const uploadedUrl = await this.awsService.uploadFile(file, filename);
        return {
            status: 201,
            body: {
                message: 'Profile image uploaded successfully',
                url: uploadedUrl,
            },
        };
    }
}