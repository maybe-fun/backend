import { IsString, IsOptional, IsEnum, IsBooleanString } from 'class-validator';
import { NotificationType } from 'src/entities/notification.entity';

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

export class GetNotificationsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsBooleanString()
  is_read?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

