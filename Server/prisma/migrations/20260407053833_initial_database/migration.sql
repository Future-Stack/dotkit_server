-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('TAX', 'INSURANCE', 'MAINTENANCE', 'MANAGEMENT', 'VACANCY', 'UTILITIES', 'OTHER');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('BRRRR', 'TURNKEY', 'SECTION_8');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ELEVATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "verifidStatus" AS ENUM ('VERIFID', 'SUSPEND', 'DECLINT', 'REQUEST');

-- CreateTable
CREATE TABLE "users" (
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "profile" TEXT,
    "otp" TEXT,
    "refreshToken" TEXT,
    "isNotification" BOOLEAN NOT NULL DEFAULT true,
    "isAgree" BOOLEAN NOT NULL DEFAULT false,
    "verifidStatus" "verifidStatus" NOT NULL DEFAULT 'REQUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PropertyCalculation" (
    "propertyId" TEXT NOT NULL,
    "strategy" "StrategyType" NOT NULL,
    "stateAddress" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allInCost" DECIMAL(12,2),
    "initialCashInvested" DECIMAL(12,2),
    "monthlyCashFlow" DECIMAL(12,2),
    "cashOnCashReturn" DOUBLE PRECISION,
    "capRate" DOUBLE PRECISION,
    "dscr" DOUBLE PRECISION,
    "onePercentRule" BOOLEAN,
    "netOperatingIncome" DECIMAL(12,2),
    "annualNoi" DECIMAL(12,2),
    "monthlyMortgage" DECIMAL(12,2),
    "annualNetCashFlow" DECIMAL(12,2),
    "totalScore" INTEGER,
    "scoreBoardStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyCalculation_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "ScoreBreakdown" (
    "scoreBreakdownId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ScoreBreakdown_pkey" PRIMARY KEY ("scoreBreakdownId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "PropertyCalculation" ADD CONSTRAINT "PropertyCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "PropertyCalculation"("propertyId") ON DELETE RESTRICT ON UPDATE CASCADE;
