import { Type } from 'class-transformer';
import { ValidateNested, IsString, IsNumber, IsArray } from 'class-validator';
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
  @ApiProperty({ example: 'trubo' })
  @IsString()
  strategy!: string;

  @ApiProperty({ type: MandyType })
  @ValidateNested()
  @Type(() => MandyType)
  responseData!: MandyType;
}