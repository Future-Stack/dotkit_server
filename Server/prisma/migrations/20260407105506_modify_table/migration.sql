-- DropForeignKey
ALTER TABLE "ScoreBreakdown" DROP CONSTRAINT "ScoreBreakdown_propertyId_fkey";

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "PropertyCalculation"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;
