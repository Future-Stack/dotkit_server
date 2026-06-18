import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";

import { AuthService } from "./auth.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { AtStrategy } from "./strategie/access-token.strategy";
import { AuthController } from "./auth.controller";
import { IEnv } from "src/config/env.config";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,

    // ✅ VERY IMPORTANT
    PassportModule.register({ defaultStrategy: "jwt" }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: process.env.JWT_SECRET!,
        signOptions: {
          expiresIn: "7d",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy],
  exports: [AuthService],
})
export class AuthModule { }