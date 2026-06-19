/*
Tujuan: Menyediakan adapter penyimpanan object S3/MinIO untuk bukti transfer fase 2.
Caller: Use case purchase package, response list order, material service, dan teacher asset upload.
Dependensi: AWS SDK S3, AppConfig storage, dan logger backend.
Main Functions: Menjamin bucket tersedia, upload/delete object, dan generate URL signed preview untuk berbagai aset.
Side Effects: Melakukan HTTP call ke endpoint S3/MinIO dan menulis object bucket.
*/

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type { AppConfig } from '../../application/services/config.service'
import { logger } from '../../shared/utils/logger.util'

export class ObjectStorageService {
  private readonly client: S3Client
  private bucketReadyPromise: Promise<void> | null = null

  constructor(private readonly config: AppConfig) {
    this.client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      forcePathStyle: config.s3ForcePathStyle,
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey
      }
    })
  }

  async uploadPaymentProof(objectKey: string, file: File): Promise<string> {
    return this.uploadObject(objectKey, file)
  }

  async uploadObject(objectKey: string, file: File): Promise<string> {
    await this.ensureBucket()

    const body = new Uint8Array(await file.arrayBuffer())
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.s3BucketName,
      Key: objectKey,
      Body: body,
      ContentType: file.type || 'application/octet-stream'
    }))

    return objectKey
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.ensureBucket()

    await this.client.send(new DeleteObjectCommand({
      Bucket: this.config.s3BucketName,
      Key: objectKey
    }))
  }

  async createSignedPreviewUrl(objectKey: string): Promise<string> {
    await this.ensureBucket()

    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: this.config.s3BucketName,
      Key: objectKey
    }), {
      expiresIn: this.config.s3PresignedUrlTtl
    })
  }

  private async ensureBucket(): Promise<void> {
    if (!this.bucketReadyPromise) {
      this.bucketReadyPromise = this.initializeBucket()
    }

    await this.bucketReadyPromise
  }

  private async initializeBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({
        Bucket: this.config.s3BucketName
      }))
    } catch (error) {
      logger.warn('Bucket MinIO belum tersedia, mencoba membuat bucket', {
        bucket: this.config.s3BucketName
      })

      await this.client.send(new CreateBucketCommand({
        Bucket: this.config.s3BucketName
      }))
    }
  }
}
