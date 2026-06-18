import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ---------------- Breakdown ----------------
class BreakdownDto {
  @ApiProperty({ example: 'Cash Flow' })
  @IsString()
  name!: string;

  @ApiProperty({ example: -5041.56 })
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
  @ApiProperty({ example: 0 })
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

// ---------------- Income ----------------
class IncomeDto {
  @ApiProperty({ example: 2000 })
  @IsNumber()
  monthlyRent!: number;

  @ApiProperty({ example: 24000 })
  @IsNumber()
  annualRent!: number;

  @ApiProperty({ example: 22080 })
  @IsNumber()
  effectiveIncome!: number;
}

// ---------------- Expenses ----------------
class ExpensesDto {
  @ApiProperty({ example: 11078.4 })
  @IsNumber()
  totalExpenses!: number;
}

// ---------------- Mortgage ----------------
class MortgageDto {
  @ApiProperty({ example: 1496.93 })
  @IsNumber()
  monthlyMortgage!: number;

  @ApiProperty({ example: 17963.16 })
  @IsNumber()
  annualMortgage!: number;
}

// ---------------- Net Cash Flow ----------------
class NetCashFlowDto {
  @ApiProperty({ example: -420.13 })
  @IsNumber()
  monthly!: number;

  @ApiProperty({ example: -5041.56 })
  @IsNumber()
  annual!: number;
}

// ---------------- Financing ----------------
class FinancingDto {
  @ApiProperty({ example: 200000 })
  @IsNumber()
  purchaseLoanAmount!: number;

  @ApiProperty({ example: 225000 })
  @IsNumber()
  refinanceLoanAmount!: number;

  @ApiProperty({ example: 4000 })
  @IsNumber()
  loanPointsCost!: number;
}

// ---------------- Income Expense ----------------
class IncomeExpenseDto {
  @ApiProperty({ type: IncomeDto })
  @ValidateNested()
  @Type(() => IncomeDto)
  income!: IncomeDto;

  @ApiProperty({ type: ExpensesDto })
  @ValidateNested()
  @Type(() => ExpensesDto)
  expenses!: ExpensesDto;

  @ApiProperty({ example: 11001.6 })
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

  @ApiProperty({ type: FinancingDto })
  @ValidateNested()
  @Type(() => FinancingDto)
  financing!: FinancingDto;
}

// ---------------- Main DTO ----------------
export class CreateBrrrrDto {
  @ApiProperty({ example: 'BRRRR' })
  @IsString()
  strategy!: string;

  @ApiProperty({ example: 'Property Name' })
  @IsOptional()
  @IsString()
  name?: string;

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

  // ---------- Metrics ----------
  @ApiProperty({ example: 282000 })
  @IsNumber()
  allInCost_m!: number;

  @ApiProperty({ example: 82000 })
  @IsNumber()
  initialCashInvested_m!: number;

  @ApiProperty({ example: -420.13 })
  @IsNumber()
  monthlyCashFlow_m!: number;

  @ApiProperty({ example: -8.26 })
  @IsNumber()
  postRefiCoC_m!: number;

  @ApiProperty({ example: 21000 })
  @IsNumber()
  cashOutAmount_m!: number;

  @ApiProperty({ example: 61000 })
  @IsNumber()
  cashLeftInDeal_m!: number;

  @ApiProperty({ example: 18000 })
  @IsNumber()
  equityCaptured_m!: number;

  @ApiProperty({ example: 225000 })
  @IsNumber()
  refinanceLoanAmount_m!: number;

  @ApiProperty({ example: 3.66 })
  @IsNumber()
  capRate_m!: number;

  @ApiProperty({ example: 0.61 })
  @IsNumber()
  DSCR_m!: number;

  @ApiProperty({ example: 11001.6 })
  @IsNumber()
  netOperatingIncome_m!: number;

  // ---------- Nested ----------
  @ApiProperty({ type: IncomeExpenseDto })
  @ValidateNested()
  @Type(() => IncomeExpenseDto)
  incomeExpance!: IncomeExpenseDto;

  @ApiProperty({ type: DealScoreboardDto })
  @ValidateNested()
  @Type(() => DealScoreboardDto)
  dealScoreboard!: DealScoreboardDto;
}
