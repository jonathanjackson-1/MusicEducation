/* eslint-disable @typescript-eslint/no-var-requires */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

type S3ClientConstructor = new (options: Record<string, any>) => {
  send: (command: any) => Promise<any>;
};

let S3ClientImpl: S3ClientConstructor;
let PutObjectCommandImpl: new (input: Record<string, any>) => any;
let GetObjectCommandImpl: new (input: Record<string, any>) => any;
let getSignedUrlImpl: (client: any, command: any, options: { expiresIn: number }) => Promise<string>;

try {
  // Dynamically require AWS SDK so tests can run without network installs.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const s3Module = require('@aws-sdk/client-s3');
  S3ClientImpl = s3Module.S3Client;
  PutObjectCommandImpl = s3Module.PutObjectCommand;
  GetObjectCommandImpl = s3Module.GetObjectCommand;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const presignModule = require('@aws-sdk/s3-request-presigner');
  getSignedUrlImpl = presignModule.getSignedUrl;
} catch {
  S3ClientImpl = class {
    // eslint-disable-next-line class-methods-use-this
    async send() {
      throw new Error('S3 client not configured. Install @aws-sdk/client-s3 to enable uploads.');
    }
  } as S3ClientConstructor;
  PutObjectCommandImpl = class {} as any;
  GetObjectCommandImpl = class {} as any;
  getSignedUrlImpl = async () => '';
}

@Injectable()
export class SubmissionStorageService {
  private readonly s3: { send: (command: any) => Promise<any> };
  private readonly bucket: string;
  private readonly maxSize: number;
  private readonly allowedMimeTypes: Set<string>;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET', 'musiceducation-dev');
    this.maxSize = Number(this.config.get<string>('SUBMISSION_MAX_FILE_SIZE', `${25 * 1024 * 1024}`));
    this.allowedMimeTypes = new Set([
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/mp4',
      'image/jpeg',
      'image/png',
      'image/gif',
    ]);

    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');

    this.s3 = new S3ClientImpl({
      region,
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  validateFile(file: Express.Multer.File) {
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type for submission.');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('Submission file exceeds allowed size.');
    }
  }

  private buildKey(fileName: string) {
    return `submissions/${randomUUID()}-${fileName}`;
  }

  async upload(file: Express.Multer.File) {
    const key = this.buildKey(file.originalname);
    await this.s3.send(
      new PutObjectCommandImpl({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = await this.createPresignedUrl(key);
    return { key, url };
  }

  async createPresignedUrl(key: string) {
    return getSignedUrlImpl(
      this.s3,
      new GetObjectCommandImpl({ Bucket: this.bucket, Key: key }),
      { expiresIn: 60 * 60 },
    );
  }
}
