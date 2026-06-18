import { ApiProperty } from '@nestjs/swagger';
import { StrategyType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SaveSection8PropertyDataDto {
  @ApiProperty({ enum: StrategyType, example: `BRRRR or TURNKEY or SECTION_8` })
  @IsEnum(StrategyType)
  strategy!: StrategyType;

  @ApiProperty({ example: 'Property Name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: '123 Main St, Los Angeles, CA' })
  @IsString()
  stateAddress!: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @ApiProperty({ example: 30000 })
  @IsNumber()
  @IsOptional()
  downPayment?: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsOptional()
  annualInsurance?: number;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @IsOptional()
  annualPropertyTax?: number;

  @ApiProperty({ example: 0.05 })
  @IsNumber()
  @IsOptional()
  vacancyRate?: number;

  @ApiProperty({ example: 0.1 })
  @IsNumber()
  @IsOptional()
  maintenanceRate?: number;

  @ApiProperty({ example: 0.08 })
  @IsNumber()
  @IsOptional()
  managementRate?: number;

  @ApiProperty({ example: 0.05 })
  @IsNumber()
  @IsOptional()
  capexRate?: number;

  @ApiProperty({
    example: {
      KeyMetrics: {
        DSCR: 0.69,
        netOperatingIncome: 11002,
        monthlyCashFlow: -253.8,
      },
      dealScoreboard: {
        totalScore: 0,
        rating: 'GOOD DEAL',
        breakdown: [
          {
            name: 'DSCR',
            value: 0.69,
            score: 0,
            status: 'BAD',
          },
        ],
      },
    },
  })
  @IsObject()
  responseData: any;
}
