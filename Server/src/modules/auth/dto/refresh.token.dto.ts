import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({ example: "userId" })
    @IsNotEmpty()
    @IsString()
    userId: string

    @ApiProperty({ example: "refresh Token" })
    @IsNotEmpty()
    @IsString()
    refreshToken: string
}