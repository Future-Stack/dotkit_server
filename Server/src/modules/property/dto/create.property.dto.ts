import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreatePropertyDto {

  // ---------------- Location ----------------
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  stateAddress: string;

  @ApiProperty({ example: 'Los Angeles' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  state: string;

  @ApiProperty({ example: '90001' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  bedRooms: number;

  // ---------------- Purchase ----------------
  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  downPayment: number;

  @ApiProperty({ example: 7, description: 'Initial Loan Interest Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate: number;

  @ApiProperty({ example: 30, description: 'Initial Loan Term (years)' })
  @IsInt()
  @Min(1)
  loanTerm: number;

  // ---------------- Rehab / Value ----------------
  @ApiProperty({ example: 20000 })
  @IsNumber()
  @Min(0)
  rehabCost: number;

  @ApiProperty({ example: 300000, description: 'After Repair Value (ARV)' })
  @IsNumber()
  @Min(0)
  arvAfterRepairValue: number;

  // ---------------- Rent ----------------
  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  // ---------------- Expenses ----------------
  @ApiProperty({ example: 3000 })
  @IsNumber()
  @Min(0)
  annualPropertyTax: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  annualInsurance: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  annualUtilities: number;

  @ApiProperty({ example: 800 })
  @IsNumber()
  @Min(0)
  annualOtherExpense: number;

  // ---------------- Percentages ----------------
  @ApiProperty({ example: 8, description: 'Vacancy Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  vacancyRate: number;

  @ApiProperty({ example: 8, description: 'Maintenance Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  maintenanceRate: number;

  @ApiProperty({ example: 10, description: 'Management Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  managementRate: number;

  @ApiProperty({ example: 5, description: 'CapEx Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  capexRate: number;

  // ---------------- BRRRR (Refinance) ----------------
  @ApiProperty({ example: 75, description: 'Refinance LTV (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  refinanceLtv: number;

  @ApiProperty({ example: 7, description: 'Refinance Interest Rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  refinanceInterestRate: number;

  @ApiProperty({ example: 30, description: 'Refinance Loan Term (years)' })
  @IsInt()
  @Min(1)
  refinanceLoanTerm: number;

  // ---------------- Advanced Costs ----------------
  @ApiProperty({ example: 5000, description: 'Closing Cost (Buy time)' })
  @IsNumber()
  @Min(0)
  closingCost: number;

  @ApiProperty({ example: 4000, description: 'Refinance Cost' })
  @IsNumber()
  @Min(0)
  refinanceCost: number;

  @ApiProperty({ example: 3000, description: 'Holding Cost during rehab' })
  @IsNumber()
  @Min(0)
  holdingCost: number;
}