const fs = require('fs');
const file = 'src/modules/auth/auth.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace generateTokens signature
code = code.replace(
  /async generateTokens\(userId: string, email: string\) \{/g,
  `async generateTokens(userId: string, email: string, sessionId: string) {`
);
code = code.replace(
  /const payload = \{ sub: userId, email \};/g,
  `const payload = { sub: userId, email, sessionId };`
);

// Update signIn
const signInRegex = /const tokens = await this\.generateTokens\(user\.userId, user\.email\);\s*await this\.updateRefreshToken\(user\.userId, tokens\.refreshToken\);/s;

const newSignInCode = `
        const maxSessions = Math.max(1, user.seatCount);
        
        const activeSessions = await this.prisma.session.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'asc' },
        });

        if (activeSessions.length >= maxSessions) {
            const sessionsToDelete = activeSessions.length - maxSessions + 1;
            const toDelete = activeSessions.slice(0, sessionsToDelete).map(s => s.id);
            await this.prisma.session.deleteMany({
                where: { id: { in: toDelete } },
            });
        }

        const newSession = await this.prisma.session.create({
            data: {
                userId: user.userId,
                token: 'pending',
            }
        });

        const tokens = await this.generateTokens(user.userId, user.email, newSession.id);
        const hashedRt = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.session.update({
            where: { id: newSession.id },
            data: { token: hashedRt }
        });

        await this.updateRefreshToken(user.userId, tokens.refreshToken);
`;
code = code.replace(signInRegex, newSignInCode);

// Update refreshToken
const refreshRegex = /const tokens = await this\.generateTokens\(user\.userId, user\.email\);\s*await this\.updateRefreshToken\(user\.userId, tokens\.refreshToken\);/s;

const newRefreshCode = `
        const decoded = this.jwtService.decode(refreshToken) as any;
        const sessionId = decoded?.sessionId;

        if (!sessionId) {
             throw new ForbiddenException("Invalid session");
        }

        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
             throw new ForbiddenException("Session expired or revoked");
        }

        const tokens = await this.generateTokens(user.userId, user.email, sessionId);
        const hashedRt = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { token: hashedRt }
        });

        await this.updateRefreshToken(user.userId, tokens.refreshToken);
`;
code = code.replace(refreshRegex, newRefreshCode);

// Update logout
const logoutRegex = /async logout\(userId: string\) \{.*?return \{/s;
const newLogoutCode = `async logout(userId: string, sessionId?: string) {
        await this.prisma.user.update({
            where: { userId: userId },
            data: {
                refreshToken: null
            }
        });

        if (sessionId) {
            await this.prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
        } else {
            await this.prisma.session.deleteMany({ where: { userId: userId } });
        }

        return {`;
code = code.replace(logoutRegex, newLogoutCode);

fs.writeFileSync(file, code);
