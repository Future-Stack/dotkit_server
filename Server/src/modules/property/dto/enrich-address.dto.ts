import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EnrichAddressDto {
  @ApiProperty({
    example: '123 Main St, Los Angeles, CA 90001',
    description:
      'Full property address string. The server will geocode it and trigger all enrichment APIs in parallel.',
  })
  @IsNotEmpty()
  @IsString()
  address!: string;
}
