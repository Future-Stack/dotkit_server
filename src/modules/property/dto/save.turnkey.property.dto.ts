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
        loanAmount: 200000,
        loanPointsCost: 4000,
        lenderFees: 3000,
        monthlyCashFlow: -413.8,
        CashOnCashReturn: -6.37,
        capRate: 4.4,
        DSCR: 0.69,
        OnePercentRule: false,
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
        noi: 11002,
        mortgage: {
          monthlyMortgage: 1330.6,
          annualMortgage: 15967.26,
        },
        netCashFlow: {
          monthly: -413.8,
          annual: -4965.66,
        },
        financing: {
          purchaseLoanAmount: 200000,
          loanPointsCost: 4000,
          lenderFees: 3000,
        },
      },
      dealScoreboard: {
        totalScore: 3,
        rating: 'BAD DEAL',
        breakdown: [
          {
            name: 'Cash Flow',
            value: -4965.659884300378,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'CoC Return',
            value: -6.36623062089792,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'Cap Rate',
            value: 4.40064,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'DSCR',
            value: 0.6890098914728128,
            score: 0,
            status: 'BAD',
          },
          {
            name: '1% Rule',
            value: false,
            score: 0,
            status: 'BAD',
          },
          {
            name: 'Crime Score',
            value: 70,
            score: 3,
            status: 'BAD',
          },
        ],
      },
    },
  })
  @IsObject()
  responseData: any;
}
