import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class GenerateCheckoutLinkDto {
  @ApiProperty({ description: 'The User ID buying the subscription', example: 'user_xyz' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'The name of the subscription', example: 'Premium Access' })
  @IsString()
  @IsNotEmpty()
  programName!: string;

  @ApiProperty({
    description: 'The price in dollars (minimum 1.00)',
    example: 100.00
  })
  @IsNumber()
  @Min(1)
  price!: number;
}
