import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CalculateBrrrPropertyDto {
  // ---------------- Location ----------------
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  stateAddress!: string;

  @ApiProperty({ example: 'Los Angeles' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  state!: string;

  @ApiProperty({ example: '90001' })
  @IsString()
  zipCode!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  bedRooms!: number;

  // ---------------- Purchase ----------------
  @ApiProperty({ example: 250000 })
  @IsNumber()
  purchasePrice!: number;

  @ApiProperty({ example: 20, description: 'Down Payment (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  downPaymentPercent!: number;

  // optional override
  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  downPayment?: number;

  @ApiProperty({ example: 7 })
  @IsNumber()
  interestRate!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  loanTerm!: number;

  // ---------------- Rehab ----------------
  @ApiProperty({ example: 20000 })
  @IsNumber()
  rehabCost!: number;

  @ApiProperty({ example: 300000 })
  @IsNumber()
  arvAfterRepairValue!: number;

  // ---------------- Rent ----------------
  @ApiProperty({ example: 2000 })
  @IsNumber()
  monthlyRent!: number;

  // ---------------- Expenses ----------------
  @ApiProperty({ example: 3000 })
  @IsNumber()
  annualPropertyTax!: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  annualInsurance!: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  annualUtilities!: number;

  @ApiProperty({ example: 800 })
  @IsNumber()
  annualOtherExpense!: number;

  // ---------------- Percent ----------------
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

  // ---------------- BRRRR ----------------
  @ApiProperty({ example: 75 })
  @IsNumber()
  refinanceLtv!: number;

  @ApiProperty({ example: 7 })
  @IsNumber()
  refinanceInterestRate!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  refinanceLoanTerm!: number;

  // ---------------- Costs ----------------
  @ApiProperty({ example: 5000 })
  @IsNumber()
  closingCost!: number;

  @ApiProperty({ example: 4000 })
  @IsNumber()
  refinanceCost!: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  holdingCost!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  loanPoints!: number;
}
