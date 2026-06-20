import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: "newPassword123" })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    newPassword: string;
}
