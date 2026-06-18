import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CalculateTurnkeyPropertyDto {
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
  bedRooms!: number;

  // ---------------- Purchase ----------------
  @ApiProperty({ example: 250000 })
  @IsNumber()
  purchasePrice!: number;

  // ✅ Percentage-based
  @ApiPropertyOptional({
    example: 20,
    description: 'Down Payment Percentage (%)',
  })
  @IsOptional()
  @IsNumber()
  downPaymentPercent?: number;

  // ✅ Override
  @ApiPropertyOptional({
    example: 50000,
    description: 'Fixed Down Payment ($) - overrides percentage if provided',
  })
  @IsOptional()
  @IsNumber()
  downPayment?: number;

  @ApiProperty({
    example: 7,
    description: 'Loan Interest Rate (%)',
  })
  @IsNumber()
  interestRate!: number;

  @ApiProperty({
    example: 30,
    description: 'Loan Term in Years',
  })
  @IsInt()
  loanTerm!: number;

  // ---------------- Rehab ----------------
  @ApiProperty({ example: 20000 })
  @IsNumber()
  rehabCost!: number;

  @ApiProperty({
    example: 300000,
    description: 'After Repair Value (ARV)',
  })
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

  // ---------------- Rates ----------------
  @ApiProperty({
    example: 8,
    description: 'Vacancy Rate (%)',
  })
  @IsNumber()
  vacancyRate!: number;

  @ApiProperty({
    example: 8,
    description: 'Maintenance Rate (%)',
  })
  @IsNumber()
  maintenanceRate!: number;

  @ApiProperty({
    example: 10,
    description: 'Management Rate (%)',
  })
  @IsNumber()
  managementRate!: number;

  @ApiProperty({
    example: 5,
    description: 'CapEx Reserve (%)',
  })
  @IsNumber()
  capexRate!: number;

  // ---------------- Financing ----------------
  @ApiPropertyOptional({
    example: 2,
    description: 'Loan Points (%) of loan amount',
  })
  @IsOptional()
  @IsNumber()
  loanPoints?: number;

  @ApiPropertyOptional({
    example: 3000,
    description: 'Additional lender fees ($)',
  })
  @IsOptional()
  @IsNumber()
  lenderFees?: number;

  // ---------------- Costs ----------------
  @ApiProperty({
    example: 5000,
    description: 'Closing Cost ($)',
  })
  @IsNumber()
  closingCost!: number;

  @ApiProperty({
    example: 3000,
    description: 'Holding Cost during rehab ($)',
  })
  @IsNumber()
  holdingCost!: number;

  // ---------------- Market Data ----------------
  @ApiPropertyOptional({
    example: 2100,
    description: 'Average Market Rent (from rental comps)',
  })
  @IsOptional()
  @IsNumber()
  marketRent?: number;

  @ApiPropertyOptional({
    example: 1800,
    description: 'Estimated Section 8 Rent',
  })
  @IsOptional()
  @IsNumber()
  section8Rent?: number;

  @ApiPropertyOptional({
    example: 70,
    description: 'Crime Score (0-100, higher = safer area)',
  })
  @IsOptional()
  @IsNumber()
  crimeScore?: number;
}
