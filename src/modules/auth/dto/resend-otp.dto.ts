import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ResendOtpDto {
    @ApiProperty({ example: "user@gmail.com" })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;
}
