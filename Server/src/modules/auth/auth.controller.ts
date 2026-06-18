import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserSignUpDto } from './dto/user.singup.dto';
import { SUCCESS_MESSAGES } from 'src/common/constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles("ELEVATOR")
  // @Get("elevator-data")
  // getElevatorData() {
  //   return "Only elevator";
  // }

  @Post("user-singup")
  @ApiOperation({ summary: "User SignUp (Only Can User)" })
  async userSignUp(@Body() data: UserSignUpDto) {
    const result = await this.authService.userSignUp(data);

    return {
      success: true,
      message: SUCCESS_MESSAGES.AUTH.REGISTRATION_SUCCESS,
      data: result
    }
  }

  @Post("login")
  @ApiOperation({ summary: "User, Elevetor & Admin Login" })
  async signIn(@Body() data: LoginDto) {
    const result = await this.authService.signIn(data);

    return {
      success: true,
      result
    }

  }

  @Post("refresh-token")
  async refreshToken(@Body() body: RefreshTokenDto) {
    const { userId, refreshToken } = body;

    const result = await this.authService.refreshToken(
      userId,
      refreshToken
    );

    return {
      success: true,
      message: "Token refreshed successfully",
      data: result
    };
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@GetCurrentUser() user: any) {
    const userId = user?.userId;

    const result = await this.authService.findUser(userId)

    return {
      success: true,
      user: result
    }
  }
}
