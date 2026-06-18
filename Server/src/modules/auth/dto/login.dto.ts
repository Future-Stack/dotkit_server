import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({ example: "user@gmail.com" })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "12345678" })
    @IsString()
    @IsNotEmpty()
    password: string;

}