import { IsString, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  fcm_token: string;

  @IsOptional()
  @IsString()
  device_fingerprint?: string;

  @IsString()
  ipAddress: string;

  @IsString()
  userAgent: string;
}
