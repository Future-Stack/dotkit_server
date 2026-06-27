import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateCheckoutLinkDto {
  @ApiProperty({ description: 'The Whop Company ID', example: 'biz_XXXXXXXXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({ description: 'The Whop Product ID', example: 'prod_XXXXXXXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ 
    description: 'Plan type (renewal or one_time)', 
    enum: ['renewal', 'one_time'], 
    default: 'renewal' 
  })
  @IsOptional()
  @IsEnum(['renewal', 'one_time'])
  planType?: 'renewal' | 'one_time';

  @ApiPropertyOptional({ 
    description: 'Billing period in days (required if planType is renewal)', 
    example: 30 
  })
  @IsOptional()
  @IsNumber()
  billingPeriod?: number;

  @ApiPropertyOptional({ 
    description: 'The price of the plan in dollars (minimum 1.00)', 
    example: 10.00 
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}
