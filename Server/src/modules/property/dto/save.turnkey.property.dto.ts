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

export class CreateTurnkeyDTO_Mod {
  @ApiProperty({ enum: StrategyType, example: `TURNKEY` })
  @IsEnum(StrategyType)
  strategy!: StrategyType;

  @ApiProperty({ example: 'Property Name' })
  @IsOptional()
  @IsString()
  name?: string;

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
        allInCost: 278000,
        initialCashInvested: 78000,
        monthlyCashFlow: -253.8,
        CashOnCashReturn: -3.9,
        capRate: 4.4,
        DSCR: 0.69,
        OnePercentRule: false,
        netOperatingIncome: 917,
      },
      incomeExpance: {
        noi: 11002,
        netCashFlow: {
          monthly: -253.8,
          annual: -3045.66,
        },
        mortgage: {
          monthlyMortgage: 1330.6,
        },
      },
      dealScoreboard: {
        totalScore: 0,
        rating: 'BAD DEAL',
        breakdown: [
          {
            name: 'Cash Flow',
            value: -3045.6598843003812,
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
