import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyWalletDto {
  @ApiProperty({ example: 'vines1vzrYbzLMRdu58em5RbLnzAxcWN8n8PaaiqyEU' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
    message: 'Invalid Solana wallet address format',
  })
  wallet_address: string;

  @ApiProperty({ description: 'Base58 encoded signature from the wallet' })
  @IsString()
  @IsNotEmpty()
  @Length(64, 128, {
    message: 'Signature length is invalid',
  })
  signature: string;

  @ApiProperty({ example: 'a7b8c9d0...' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  nonce: string;
}
