import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

@Injectable()
export class ElevatorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (user.role !== "ELEVATOR") {
      throw new ForbiddenException("Only elevator can access");
    }

    return true;
  }
}