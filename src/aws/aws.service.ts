import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, PutObjectCommandInput, ObjectCannedACL } from '@aws-sdk/client-s3';
import { awsS3Config } from './aws.config';

@Injectable()
export class AwsService {
    private readonly s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client(awsS3Config);
    }



    async uploadFile(buffer: Buffer, filename: string): Promise<string> {
        console.log(buffer, filename)
        try {
            const params: PutObjectCommandInput = {
                Bucket: 'talent-profiles',
                Key: filename,
                Body: buffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read' as ObjectCannedACL, 
            };
            const command = new PutObjectCommand(params);
            const result = await this.s3Client.send(command);
            if (result.$metadata.httpStatusCode === 200) {
                return filename;
            } else {
                console.log(result.$metadata.httpStatusCode)
                throw new Error(`Upload failed with status code ${result.$metadata.httpStatusCode}`);
            }
        } catch (error) {
            console.log(error.message)
            return `Error uploading file: ${error.message}`;
        }
    }
    async destroy() {
        this.s3Client.destroy();
    }
}
