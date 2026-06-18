import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UserSignUpDto {

    @ApiProperty({ example: "Mohammad Jihad" })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: "user@gmail.com" })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({ example: "" })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({ example: "12345678" })
    @IsNotEmpty()
    @IsString()
    password: string
}