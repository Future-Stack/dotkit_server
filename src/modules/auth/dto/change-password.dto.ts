import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({ example: "currentPassword123" })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: "newPassword123" })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: "New password must be at least 6 characters long" })
    newPassword: string;
}
