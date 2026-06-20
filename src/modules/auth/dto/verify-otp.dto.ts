import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyOtpDto {
    @ApiProperty({ example: "user@gmail.com" })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "123456" })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6, { message: "OTP must be exactly 6 characters" })
    otp: string;
}
