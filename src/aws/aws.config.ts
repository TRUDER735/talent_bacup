import { S3ClientConfig } from '@aws-sdk/client-s3';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import * as dotenv from 'dotenv';

dotenv.config();

const credentials: AwsCredentialIdentity = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
};

export const awsS3Config: S3ClientConfig = {
    forcePathStyle: true,
    endpoint: process.env.SPACES_ENDPOINT,
    region: 'nyc3',
    credentials,
};