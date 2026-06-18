/*
  Warnings:

  - You are about to drop the column `monthlyCashFlow` on the `PropertyCalculation` table. All the data in the column will be lost.
  - Added the required column `cashLeftInDeal` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cashOutAmount` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equityCaptured` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hudCap` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lenderFees` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loanPointsCost` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseLoanAmount` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refinanceLoanAmount` to the `PropertyCalculation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PropertyCalculation" DROP COLUMN "monthlyCashFlow",
ADD COLUMN     "annualMortgage" DECIMAL(12,2),
ADD COLUMN     "cashLeftInDeal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "cashOutAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "equityCaptured" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "hudCap" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "lenderFees" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "loanPointsCost" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "monthlyNetCashFlow" DECIMAL(12,2),
ADD COLUMN     "postRefiCoC" DECIMAL(12,2),
ADD COLUMN     "purchaseLoanAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "refinanceLoanAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "stabilityFactor" DOUBLE PRECISION;
