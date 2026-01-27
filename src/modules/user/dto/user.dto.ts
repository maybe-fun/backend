import {
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import type { NotificationPreferences } from 'src/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsOptional()
  @IsObject()
  notification_preferences?: NotificationPreferences;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CheckUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;
}
