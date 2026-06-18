import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ---------------- Breakdown ----------------
class BreakdownDto {
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

  @ApiProperty({ type: [BreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakdownDto)
  breakdown!: BreakdownDto[];
}

// ---------------- Key Metrics ----------------
class KeyMetricsDto {
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

// ---------------- Response Data ----------------
class ResponseDataDto {
  @ApiProperty({ type: KeyMetricsDto })
  @ValidateNested()
  @Type(() => KeyMetricsDto)
  KeyMetrics!: KeyMetricsDto;

  @ApiProperty({ type: DealScoreboardDto })
  @ValidateNested()
  @Type(() => DealScoreboardDto)
  dealScoreboard!: DealScoreboardDto;
}

// ---------------- MAIN DTO ----------------
export class CreateSaveSection8Dto {
  @ApiProperty({ example: 'SECTION_8' })
  @IsString()
  strategy!: string;

  @ApiProperty({ type: ResponseDataDto })
  @ValidateNested()
  @Type(() => ResponseDataDto)
  responseData!: ResponseDataDto;
}
