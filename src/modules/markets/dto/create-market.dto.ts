import {
  ArrayMaxSize,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export interface CreateMarketResponse {
  draft_id: string;
  question_uri: string;
  metadata: {
    question: string;
    description: string;
    image_url: string | null;
  };
  creation_fee_lamports: string;
  estimated_gas: string;
}

export class CreateMarketDto {
  @IsString()
  @MaxLength(200)
  question: string;

  @IsString()
  description: string; // HTML allowed

  @IsUUID()
  category_id: string;

  @IsOptional()
  @IsUUID('all', { each: true })
  @ArrayMaxSize(3)
  topic_ids?: string[];

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsString()
  resolution_criteria: string;

  @IsOptional()
  @IsUrl()
  resolution_source?: string;

  @IsInt()
  @Min(Math.floor(Date.now() / 1000))
  trading_close_ts: number;
}
