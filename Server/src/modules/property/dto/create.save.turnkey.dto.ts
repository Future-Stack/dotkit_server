import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ---------------- Breakdown ----------------
class BreakdownDto {
  @ApiProperty({ example: 'Cash Flow' })
  @IsString()
  name!: string;

  @ApiProperty({ example: -3045.66 })
  @IsNumber()
  value!: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  score!: number;

  @ApiProperty({ example: 'BAD' })
  @IsString()
  status!: string;
}

// ---------------- Deal Scoreboard ----------------
class DealScoreboardDto {
  @ApiProperty({ example: 15 })
  @IsNumber()
  totalScore!: number;

  @ApiProperty({ example: 'BAD DEAL' })
  @IsString()
  rating!: string;

  @ApiProperty({ type: [BreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakdownDto)
  breakdown!: BreakdownDto[];
}

// ---------------- Mortgage ----------------
class MortgageDto {
  @ApiProperty({ example: 1330.6 })
  @IsNumber()
  monthlyMortgage!: number;

  @ApiProperty({ example: 15967.26 })
  @IsNumber()
  annualMortgage!: number;
}

// ---------------- Net Cash Flow ----------------
class NetCashFlowDto {
  @ApiProperty({ example: -253.8 })
  @IsNumber()
  monthly!: number;

  @ApiProperty({ example: -3045.66 })
  @IsNumber()
  annual!: number;
}

// ---------------- Income Expense ----------------
class IncomeExpenseDto {
  @ApiProperty({ example: 11002 })
  @IsNumber()
  noi!: number;

  @ApiProperty({ type: MortgageDto })
  @ValidateNested()
  @Type(() => MortgageDto)
  mortgage!: MortgageDto;

  @ApiProperty({ type: NetCashFlowDto })
  @ValidateNested()
  @Type(() => NetCashFlowDto)
  netCashFlow!: NetCashFlowDto;
}

// ---------------- Key Metrics ----------------
class KeyMetricsDto {
  @ApiProperty({ example: 285000 })
  @IsNumber()
  allInCost!: number;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  initialCashInvested!: number;

  @ApiProperty({ example: 200000 })
  @IsNumber()
  loanAmount!: number;

  @ApiProperty({ example: 4000 })
  @IsNumber()
  loanPointsCost!: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  lenderFees!: number;

  @ApiProperty({ example: -253.8 })
  @IsNumber()
  monthlyCashFlow!: number;

  @ApiProperty({ example: -3.58 })
  @IsNumber()
  CashOnCashReturn!: number;

  @ApiProperty({ example: 4.4 })
  @IsNumber()
  capRate!: number;

  @ApiProperty({ example: 0.69 })
  @IsNumber()
  DSCR!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  OnePercentRule!: boolean;

  @ApiProperty({ example: 11002 })
  @IsNumber()
  netOperatingIncome!: number;
}

// ---------------- Response Data ----------------
class ResponseDataDto {
  @ApiProperty({ type: KeyMetricsDto })
  @ValidateNested()
  @Type(() => KeyMetricsDto)
  KeyMetrics!: KeyMetricsDto;

  @ApiProperty({ type: IncomeExpenseDto })
  @ValidateNested()
  @Type(() => IncomeExpenseDto)
  incomeExpance!: IncomeExpenseDto;

  @ApiProperty({ type: DealScoreboardDto })
  @ValidateNested()
  @Type(() => DealScoreboardDto)
  dealScoreboard!: DealScoreboardDto;
}

// ---------------- Main DTO ----------------
export class CreateTurnkeyDto {
  @ApiProperty({ example: 'TURNKEY' })
  @IsString()
  strategy!: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  stateAddress!: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  purchasePrice!: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  downPayment!: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  annualInsurance!: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  annualPropertyTax!: number;

  @ApiProperty({ example: 8 })
  @IsNumber()
  vacancyRate!: number;

  @ApiProperty({ example: 8 })
  @IsNumber()
  maintenanceRate!: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  managementRate!: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  capexRate!: number;

  // ---------- Nested Response ----------
  @ApiProperty({ type: ResponseDataDto })
  @ValidateNested()
  @Type(() => ResponseDataDto)
  responseData!: ResponseDataDto;
}
