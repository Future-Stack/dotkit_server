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

export class SaveBrrrPropertyDataDto {
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
        allInCost: 278000,
        initialCashInvested: 78000,
        monthlyCashFlow: -420.13,
        postRefiCoC: -8.84,
        cashOutAmount: 21000,
        cashLeftInDeal: 57000,
        cashOutPercentage: 26.92,
        capRate: 3.67,
        DSCR: 0.61,
        OnePercentRuleAllIn: false,
        netOperatingIncome: 11002,
      },
      incomeExpance: {
        income: {
          monthlyRent: 2000,
          annualRent: 24000,
          effectiveIncome: 22080,
        },
        expenses: {
          totalExpenses: 11078.4,
        },
        noi: 11001.599999999999,
        mortgage: {
          monthlyMortgage: 1496.93,
          annualMortgage: 17963.17,
        },
        netCashFlow: {
          monthly: -420.13,
          annual: -5041.57,
          totalAnnualExpenses: 11078.4,
        },
      },
      dealScoreboard: {
        totalScore: 0,
        rating: 'BAD DEAL',
        breakdown: [
          {
            name: 'Cash Flow',
            value: -5041.57,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'Post-Refi CoC',
            value: -8.844859649122807,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'Cap Rate',
            value: 3.6672,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'DSCR',
            value: 0.6124532368647224,
            score: 0,
            status: 'BAD',
          },
          {
            name: '1% Rule (All-In)',
            value: false,
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
