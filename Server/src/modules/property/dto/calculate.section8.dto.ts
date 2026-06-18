import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * DTO for calculating Section 8 / DSCR metrics.
 *
 * NOTE: This DTO intentionally has NO refinance fields.
 * Refinance logic is BRRRR-only. Section 8 uses standard purchase financing.
 */
export class CalculateSection8Dto {
  // ─── Location ────────────────────────────────────────────────────────────────

  @ApiProperty({ example: '123 Main St, Los Angeles, CA 90001' })
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

  @ApiProperty({ example: 3, description: 'Number of bedrooms (used for HUD FMR lookup)' })
  @IsInt()
  @Min(0)
  @Max(4)
  bedRooms!: number;

  // ─── Purchase / Financing ────────────────────────────────────────────────────

  @ApiProperty({ example: 150000, description: 'Purchase price in dollars' })
  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @ApiPropertyOptional({
    example: 20,
    description:
      'Down payment as a percentage (%). Calculated automatically from purchasePrice. ' +
      'If both downPaymentPercent and downPayment are provided, downPayment (absolute $) takes precedence.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  downPaymentPercent?: number;

  @ApiPropertyOptional({
    example: 30000,
    description: 'Down payment as an absolute dollar amount — overrides downPaymentPercent if set',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @ApiProperty({ example: 7, description: 'Annual interest rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(30)
  interestRate!: number;

  @ApiProperty({ example: 30, description: 'Loan term in years' })
  @IsInt()
  @Min(1)
  @Max(40)
  loanTerm!: number;

  // ─── HUD / Rent Data ─────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 1400,
    description:
      'HUD Fair Market Rent for the bedroom count/area — auto-populated from /property/enrich-address. ' +
      'If not provided, monthlyRent is used as the baseline.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hudFmrRent?: number;

  @ApiProperty({
    example: 1350,
    description: 'Actual monthly rent the property will command',
  })
  @IsNumber()
  @Min(0)
  monthlyRent!: number;

  // ─── Fixed Expenses ───────────────────────────────────────────────────────────

  @ApiProperty({ example: 2000, description: 'Annual property tax ($)' })
  @IsNumber()
  @Min(0)
  annualPropertyTax!: number;

  @ApiProperty({ example: 1200, description: 'Annual insurance ($)' })
  @IsNumber()
  @Min(0)
  annualInsurance!: number;

  @ApiProperty({ example: 600, description: 'Annual utilities ($)' })
  @IsNumber()
  @Min(0)
  annualUtilities!: number;

  @ApiProperty({ example: 500, description: 'Annual other / miscellaneous expenses ($)' })
  @IsNumber()
  @Min(0)
  annualOtherExpense!: number;

  // ─── Percentage-Based Expenses ────────────────────────────────────────────────

  @ApiProperty({ example: 5, description: 'Vacancy rate (%) — typically lower for Section 8' })
  @IsNumber()
  @Min(0)
  @Max(100)
  vacancyRate!: number;

  @ApiProperty({ example: 8, description: 'Maintenance rate (% of effective gross income)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  maintenanceRate!: number;

  @ApiProperty({ example: 10, description: 'Property management rate (% of effective gross income)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  managementRate!: number;

  @ApiProperty({ example: 5, description: 'CapEx reserve rate (% of effective gross income)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  capexRate!: number;
}
