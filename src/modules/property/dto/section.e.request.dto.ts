import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ---------------- Key Metrics ----------------
class CbdType {
  @ApiProperty({ example: 0.76 })
  @IsNumber()
  DSCR!: number;

  @ApiProperty({ example: 11510 })
  @IsNumber()
  netOperatingIncome!: number;

  @ApiProperty({ example: -331.4 })
  @IsNumber()
  monthlyCashFlow!: number;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  section8Rent!: number;

  @ApiProperty({ example: 2100 })
  @IsNumber()
  hudCap!: number;

  @ApiProperty({ example: 0.98 })
  @IsNumber()
  stabilityFactor!: number;
}

// ---------------- Breakdown ----------------
class KdiType {
  @ApiProperty({ example: 'DSCR' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 0.76 })
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

  @ApiProperty({ type: [KdiType] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KdiType)
  breakdown!: KdiType[];
}

// ---------------- Response Data ----------------
class MandyType {
  @ApiProperty({ type: CbdType })
  @ValidateNested()
  @Type(() => CbdType)
  KeyMetrics!: CbdType;

  @ApiProperty({ type: DealScoreboardDto })
  @ValidateNested()
  @Type(() => DealScoreboardDto)
  dealScoreboard!: DealScoreboardDto;
}

// ---------------- MAIN DTO ----------------
export class Section8RequestDto {
  @ApiProperty({ example: 'SECTION_8' })
  @IsString()
  strategy!: string;

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

  @ApiProperty({ example: 3.66 })
  @IsNumber()
  crimeScore!: number;

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

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  fmrStudio?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  fmrOneBed?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  fmrTwoBed?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  fmrThreeBed?: number;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsOptional()
  fmrFourBed?: number;

  @ApiProperty()
  @IsOptional()
  responseData?: any;
}