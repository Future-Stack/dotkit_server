import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { IEnv } from "src/config/env.config";

@Injectable()
export class AtStrategy extends PassportStrategy(JwtStrategy, "jwt") {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {

        const env = configService.get<IEnv>("env");

        super({

            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: env?.JWT_CONFIG.JWT_SECRET as string,
        });
    }

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { userId: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        if (user.role === "ELEVATOR" && user.verifidStatus === "REQUEST") {
            throw new BadRequestException(
                "You are not approved. Please contact admin"
            );
        }

        if (user.verifidStatus === "SUSPEND") {
            throw new UnauthorizedException("Account suspended");
        }

        return {
            userId: user.userId,
            email: user.email,
            role: user.role,
        };
    }
}