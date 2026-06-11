import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create.property.dto';
import { CalculateBrrrPropertyDto } from './dto/calculate.brrrr.property.dto';
import { CalculateTurnkeyPropertyDto } from './dto/calculate.turnkey.property.dto';
import { CalculateSection8Dto } from './dto/calculate.section8.dto';
import { CreateBrrrrDto } from './dto/create.save.brrr.property.dto';
import { CreateTurnkeyDTO_Mod } from './dto/save.turnkey.property.dto';
import { Section8RequestDto } from './dto/section.e.request.dto';
import { ExternalApisService } from '../external-apis/external-apis.service';
import { GeocodeResult } from '../external-apis/dto/geocode-response.dto';
import { FmrResult } from '../external-apis/dto/fmr-response.dto';
import { CompsResult } from '../external-apis/dto/comps-response.dto';
import { CrimeResult } from '../external-apis/dto/crime-response.dto';

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private externalApis: ExternalApisService,
  ) { }


  async enrichAddress(address: string) {
    // Step 1: Geocode to extract structured location data
    const geocode: GeocodeResult = await this.externalApis.geocodeAddress(address);

    // Step 2: All enrichment APIs fire in parallel — none blocks the others
    const [fmr, comps, crime] = await Promise.allSettled([
      this.externalApis.getFmrData(geocode.state, geocode.county, geocode.city),
      this.externalApis.getRentalAndSoldComps(
        geocode.latitude,
        geocode.longitude,
        geocode.formattedAddress,
      ),
      this.externalApis.getCrimeData(geocode.latitude, geocode.longitude, geocode.state, geocode.city),
    ]);

    const fmrData: FmrResult | null =
      fmr.status === 'fulfilled' ? fmr.value : null;
    const compsData: CompsResult =
      comps.status === 'fulfilled' ? comps.value : { rental: [], sold: [] };
    const crimeData: CrimeResult =
      crime.status === 'fulfilled'
        ? crime.value
        : { crimeScore: 0, riskLabel: 'UNKNOWN', totalIncidents: 0, crimesByType: [], dataSource: 'UNKNOWN', incidents: [] };

    return {
      propertyPhoto: geocode.propertyPhoto ?? null,
      geocode,
      fmr: fmrData
        ? {
          county: fmrData.county,
          state: fmrData.state,
          year: fmrData.year,
          rents: {
            studio: fmrData.studio,
            oneBedroom: fmrData.oneBedroom,
            twoBedroom: fmrData.twoBedroom,
            threeBedroom: fmrData.threeBedroom,
            fourBedroom: fmrData.fourBedroom,
          },
        }
        : null,
      comps: {
        rental: compsData.rental,
        sold: compsData.sold,
        estimates: {
          rentEstimate: compsData.rentEstimate ?? null,
          valueEstimate: compsData.valueEstimate ?? null,
        },
      },
      crime: {
        crimeScore: crimeData.crimeScore,
        riskLabel: crimeData.riskLabel,
        totalIncidents: crimeData.totalIncidents,
        areaName: crimeData.areaName ?? null,
        population: crimeData.population ?? null,
        dataSource: crimeData.dataSource,
        crimesByType: crimeData.crimesByType,
        areaSummary: crimeData.areaSummary ?? null,
        // Legacy incidents array (backward-compat with save endpoints)
        incidents: crimeData.incidents,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BRRRR CALCULATOR
  // ═══════════════════════════════════════════════════════════════════════════

  async calculateBrrrr(dto: CalculateBrrrPropertyDto) {
    // ─── Down Payment ──────────────────────────────────────────────────────
    const downPayment =
      dto.downPayment ?? (dto.purchasePrice * dto.downPaymentPercent) / 100;

    const loanAmount = dto.purchasePrice - downPayment;
    const loanPointsCost = (loanAmount * dto.loanPoints) / 100;

    // ─── Base Income ───────────────────────────────────────────────────────
    const annualRent = dto.monthlyRent * 12;
    const effectiveIncome = annualRent * (1 - dto.vacancyRate / 100);

    // ─── Expenses ──────────────────────────────────────────────────────────
    const maintenance = (dto.maintenanceRate / 100) * effectiveIncome;
    const management = (dto.managementRate / 100) * effectiveIncome;
    const capex = (dto.capexRate / 100) * effectiveIncome;

    const totalExpenses =
      dto.annualPropertyTax +
      dto.annualInsurance +
      dto.annualUtilities +
      dto.annualOtherExpense +
      maintenance +
      management +
      capex;

    // ─── NOI ───────────────────────────────────────────────────────────────
    const noi = effectiveIncome - totalExpenses;

    // ─── Refinance (BRRRR-ONLY logic) ─────────────────────────────────────
    const refinanceLoanAmount = (dto.refinanceLtv / 100) * dto.arvAfterRepairValue;

    const refiRate = dto.refinanceInterestRate / 100 / 12;
    const refiPayments = dto.refinanceLoanTerm * 12;
    const refiMortgage =
      (refinanceLoanAmount * refiRate) /
      (1 - Math.pow(1 + refiRate, -refiPayments));

    // ─── Cash Flow ─────────────────────────────────────────────────────────
    const monthlyExpenses = totalExpenses / 12;
    const monthlyCashFlow = dto.monthlyRent - monthlyExpenses - refiMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    // ─── Investment Totals ─────────────────────────────────────────────────
    const allInCost =
      dto.purchasePrice +
      dto.rehabCost +
      dto.closingCost +
      dto.holdingCost +
      loanPointsCost;

    const initialCashInvested =
      downPayment + dto.rehabCost + dto.closingCost + dto.holdingCost + loanPointsCost;

    // ─── BRRRR Core Metrics ────────────────────────────────────────────────
    const cashOut = refinanceLoanAmount - loanAmount - dto.refinanceCost;
    const cashLeftInDeal = initialCashInvested - cashOut;
    const postRefiCoC = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : 0;
    const equityCaptured = dto.arvAfterRepairValue - allInCost;

    const dscr = refiMortgage * 12 > 0 ? noi / (refiMortgage * 12) : 0;
    const capRate = (noi / dto.arvAfterRepairValue) * 100;
    const onePercentRule = dto.monthlyRent >= allInCost * 0.01;

    // ─── Scoreboard ────────────────────────────────────────────────────────
    const scoreLookup = (val: number, good: number, avg: number) => {
      if (val >= good) return { score: 10, status: 'GOOD' };
      if (val >= avg) return { score: 5, status: 'AVERAGE' };
      return { score: 0, status: 'BAD' };
    };

    const breakdown = [
      { name: 'Cash Flow', value: annualCashFlow, ...scoreLookup(annualCashFlow, 3000, 1200) },
      { name: 'Post-Refi CoC', value: postRefiCoC, ...scoreLookup(postRefiCoC, 12, 6) },
      { name: 'Cap Rate', value: capRate, ...scoreLookup(capRate, 8, 5) },
      { name: 'DSCR', value: dscr, ...scoreLookup(dscr, 1.25, 1.0) },
      {
        name: '1% Rule (All-In)',
        value: onePercentRule,
        score: onePercentRule ? 10 : 0,
        status: onePercentRule ? 'GOOD' : 'BAD',
      },
    ];

    const totalScore = breakdown.reduce((sum, i) => sum + i.score, 0);
    const rating =
      totalScore >= 40 ? 'GOOD DEAL' : totalScore >= 25 ? 'AVERAGE DEAL' : 'BAD DEAL';

    return {
      strategy: 'BRRRR',
      stateAddress: dto.stateAddress,
      purchasePrice: dto.purchasePrice,
      downPayment,
      annualInsurance: dto.annualInsurance,
      annualPropertyTax: dto.annualPropertyTax,
      vacancyRate: dto.vacancyRate,
      maintenanceRate: dto.maintenanceRate,
      managementRate: dto.managementRate,
      capexRate: dto.capexRate,

      // ── BRRRR-Specific Key Metrics ──
      allInCost_m: allInCost,
      initialCashInvested_m: initialCashInvested,
      monthlyCashFlow_m: Number(monthlyCashFlow.toFixed(2)),
      postRefiCoC_m: Number(postRefiCoC.toFixed(2)),
      cashOutAmount_m: Number(cashOut.toFixed(2)),
      cashLeftInDeal_m: Number(cashLeftInDeal.toFixed(2)),
      equityCaptured_m: Number(equityCaptured.toFixed(2)),
      refinanceLoanAmount_m: Number(refinanceLoanAmount.toFixed(2)),
      capRate_m: Number(capRate.toFixed(2)),
      DSCR_m: Number(dscr.toFixed(2)),
      netOperatingIncome_m: Number(noi.toFixed(2)),

      incomeExpance: {
        income: { monthlyRent: dto.monthlyRent, annualRent, effectiveIncome },
        expenses: { totalExpenses },
        noi,
        mortgage: {
          monthlyMortgage: Number(refiMortgage.toFixed(2)),
          annualMortgage: Number((refiMortgage * 12).toFixed(2)),
        },
        netCashFlow: {
          monthly: Number(monthlyCashFlow.toFixed(2)),
          annual: Number(annualCashFlow.toFixed(2)),
        },
        financing: {
          purchaseLoanAmount: loanAmount,
          refinanceLoanAmount: Number(refinanceLoanAmount.toFixed(2)),
          loanPointsCost,
        },
      },
      dealScoreboard: { totalScore, rating, breakdown },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TURNKEY CALCULATOR — No refinance logic
  // ═══════════════════════════════════════════════════════════════════════════

  async generateTurnkeyReport(dto: CalculateTurnkeyPropertyDto) {
    // ─── Down Payment ──────────────────────────────────────────────────────
    const downPayment =
      dto.downPayment ??
      (dto.downPaymentPercent ? (dto.purchasePrice * dto.downPaymentPercent) / 100 : 0);

    // ─── Financing (Standard purchase loan — NO refinance) ────────────────
    const loanAmount = dto.purchasePrice - downPayment;
    const loanPointsCost = dto.loanPoints ? (loanAmount * dto.loanPoints) / 100 : 0;
    const lenderFees = dto.lenderFees || 0;
    const totalFinancingCost = loanPointsCost + lenderFees;

    const monthlyRate = dto.interestRate / 100 / 12;
    const totalPayments = dto.loanTerm * 12;
    const monthlyMortgage =
      (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const annualMortgage = monthlyMortgage * 12;

    // ─── Investment ────────────────────────────────────────────────────────
    const allInCost =
      dto.purchasePrice + dto.rehabCost + dto.closingCost + dto.holdingCost + totalFinancingCost;
    const initialCashInvested =
      downPayment + dto.rehabCost + dto.closingCost + dto.holdingCost + totalFinancingCost;

    // ─── Income ────────────────────────────────────────────────────────────
    const annualRent = dto.monthlyRent * 12;
    const vacancyLoss = (dto.vacancyRate / 100) * annualRent;
    const effectiveIncome = annualRent - vacancyLoss;

    // ─── Expenses ──────────────────────────────────────────────────────────
    const maintenance = (dto.maintenanceRate / 100) * effectiveIncome;
    const management = (dto.managementRate / 100) * effectiveIncome;
    const capex = (dto.capexRate / 100) * effectiveIncome;
    const totalExpenses =
      dto.annualPropertyTax +
      dto.annualInsurance +
      dto.annualUtilities +
      dto.annualOtherExpense +
      maintenance +
      management +
      capex;

    // ─── NOI & Cash Flow ───────────────────────────────────────────────────
    const noi = effectiveIncome - totalExpenses;
    const monthlyCashFlow = dto.monthlyRent - totalExpenses / 12 - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    // ─── Metrics ───────────────────────────────────────────────────────────
    const coc = initialCashInvested > 0 ? (annualCashFlow / initialCashInvested) * 100 : 0;
    const capRate = (noi / dto.purchasePrice) * 100;
    const dscr = annualMortgage > 0 ? noi / annualMortgage : 0;
    const onePercentRule = dto.monthlyRent >= allInCost * 0.01;

    // ─── Market Data (from enrichment API or manual input) ────────────────
    const marketRent = dto.marketRent ?? dto.monthlyRent;
    const section8Rent = dto.section8Rent ?? dto.monthlyRent * 0.9;
    const crimeScore = dto.crimeScore ?? 50;
    const rentVsMarket = dto.monthlyRent / marketRent;

    // ─── Scoreboard ────────────────────────────────────────────────────────
    const scoreLookup = (val: number, good: number, avg: number) => {
      if (val >= good) return { score: 10, status: 'GOOD' };
      if (val >= avg) return { score: 5, status: 'AVERAGE' };
      return { score: 0, status: 'BAD' };
    };

    const breakdown = [
      { name: 'Cash Flow', value: annualCashFlow, ...scoreLookup(annualCashFlow, 3000, 1200) },
      { name: 'CoC Return', value: coc, ...scoreLookup(coc, 8, 5) },
      { name: 'Cap Rate', value: capRate, ...scoreLookup(capRate, 8, 5) },
      { name: 'DSCR', value: dscr, ...scoreLookup(dscr, 1.25, 1.0) },
      {
        name: '1% Rule',
        value: onePercentRule,
        score: onePercentRule ? 10 : 0,
        status: onePercentRule ? 'GOOD' : 'BAD',
      },
      { name: 'Rent vs Market', value: rentVsMarket, ...scoreLookup(rentVsMarket, 1, 0.9) },
      { name: 'Crime Score', value: crimeScore, ...scoreLookup(crimeScore, 70, 50) },
    ];

    const totalScore = breakdown.reduce((sum, i) => sum + i.score, 0);
    const rating =
      totalScore >= 40 ? 'GOOD DEAL' : totalScore >= 25 ? 'AVERAGE DEAL' : 'BAD DEAL';

    return {
      strategy: 'TURNKEY',
      stateAddress: dto.stateAddress,
      purchasePrice: dto.purchasePrice,
      downPayment,
      annualInsurance: dto.annualInsurance,
      annualPropertyTax: dto.annualPropertyTax,
      vacancyRate: dto.vacancyRate,
      maintenanceRate: dto.maintenanceRate,
      managementRate: dto.managementRate,
      capexRate: dto.capexRate,
      responseData: {
        KeyMetrics: {
          allInCost,
          initialCashInvested,
          loanAmount,
          loanPointsCost,
          lenderFees,
          monthlyCashFlow: Number(monthlyCashFlow.toFixed(2)),
          CashOnCashReturn: Number(coc.toFixed(2)),
          capRate: Number(capRate.toFixed(2)),
          DSCR: Number(dscr.toFixed(2)),
          OnePercentRule: onePercentRule,
          netOperatingIncome: Number(noi.toFixed(0)),
        },
        incomeExpance: {
          noi: Number(noi.toFixed(0)),
          mortgage: {
            monthlyMortgage: Number(monthlyMortgage.toFixed(2)),
            annualMortgage: Number(annualMortgage.toFixed(2)),
          },
          netCashFlow: {
            monthly: Number(monthlyCashFlow.toFixed(2)),
            annual: Number(annualCashFlow.toFixed(2)),
          },
        },
        dealScoreboard: { totalScore, rating, breakdown },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8 CALCULATOR — Clean rewrite, no refinance fields
  // ═══════════════════════════════════════════════════════════════════════════

  async calculateSection8(dto: CalculateSection8Dto) {
    // ─── Down Payment (percent OR absolute) ───────────────────────────────
    const downPayment =
      dto.downPayment ?? (dto.purchasePrice * (dto.downPaymentPercent ?? 20)) / 100;

    const loanAmount = dto.purchasePrice - downPayment;

    // ─── Standard Purchase Loan (NO Refinance) ────────────────────────────
    const monthlyRate = dto.interestRate / 100 / 12;
    const totalPayments = dto.loanTerm * 12;
    const monthlyMortgage =
      (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const annualDebtService = monthlyMortgage * 12;

    // ─── HUD FMR Rent — use API value if provided, else fall back ─────────
    // HUD FMR rent is the maximum the Section 8 voucher will cover.
    // The actual rent must be at or below this cap to be Section 8 eligible.
    const fmrRent = dto.hudFmrRent ?? dto.monthlyRent;
    const section8Rent = Math.min(dto.monthlyRent, fmrRent * 1.1); // 110% FMR cap (HUD rule)
    const hudCap = fmrRent * 1.1;

    const annualIncome = section8Rent * 12;

    // Section 8 stability factor — government-backed payments, very low vacancy
    const stabilityFactor = 0.98;
    const effectiveIncome = annualIncome * stabilityFactor;

    // ─── Expenses ──────────────────────────────────────────────────────────
    const operatingExpenses =
      dto.annualPropertyTax +
      dto.annualInsurance +
      dto.annualUtilities +
      dto.annualOtherExpense;

    const maintenance = (dto.maintenanceRate / 100) * effectiveIncome;
    const management = (dto.managementRate / 100) * effectiveIncome;
    const capex = (dto.capexRate / 100) * effectiveIncome;

    // Section 8 compliance overhead (annual inspection, paperwork, etc.)
    const complianceCost = 600;

    const totalExpenses = operatingExpenses + maintenance + management + capex + complianceCost;

    // ─── NOI ───────────────────────────────────────────────────────────────
    const noi = effectiveIncome - totalExpenses;

    // ─── Risk-Adjusted DSCR (Section 8 specific) ──────────────────────────
    const riskFactor = 1.05; // Slight premium for inspection risk
    const riskAdjustedNOI = noi * riskFactor;
    const dscr = annualDebtService > 0 ? riskAdjustedNOI / annualDebtService : 0;

    // ─── Cash Flow ─────────────────────────────────────────────────────────
    const monthlyCashFlow = section8Rent - totalExpenses / 12 - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    // ─── Additional Metrics ────────────────────────────────────────────────
    const initialCashInvested = downPayment;
    const coc = initialCashInvested > 0 ? (annualCashFlow / initialCashInvested) * 100 : 0;
    const capRate = (noi / dto.purchasePrice) * 100;
    const onePercentRule = section8Rent >= dto.purchasePrice * 0.01;

    // ─── Scoreboard ────────────────────────────────────────────────────────
    const scoreLookup = (val: number, good: number, avg: number) => {
      if (val >= good) return { score: 10, status: 'GOOD' };
      if (val >= avg) return { score: 5, status: 'AVERAGE' };
      return { score: 0, status: 'BAD' };
    };

    const breakdown = [
      { name: 'DSCR', value: Number(dscr.toFixed(2)), ...scoreLookup(dscr, 1.25, 1.1) },
      { name: 'Cash Flow', value: Number(annualCashFlow.toFixed(2)), ...scoreLookup(annualCashFlow, 3000, 1200) },
      { name: 'Cap Rate', value: Number(capRate.toFixed(2)), ...scoreLookup(capRate, 8, 5) },
      { name: 'CoC Return', value: Number(coc.toFixed(2)), ...scoreLookup(coc, 8, 5) },
      {
        name: '1% Rule',
        value: onePercentRule,
        score: onePercentRule ? 10 : 0,
        status: onePercentRule ? 'GOOD' : 'BAD',
      },
    ];

    const totalScore = breakdown.reduce((sum, i) => sum + i.score, 0);
    const rating =
      totalScore >= 40 ? 'GOOD DEAL' : totalScore >= 25 ? 'AVERAGE DEAL' : 'BAD DEAL';

    return {
      strategy: 'SECTION_8',
      stateAddress: dto.stateAddress,
      purchasePrice: dto.purchasePrice,
      downPayment: Number(downPayment.toFixed(2)),
      annualInsurance: dto.annualInsurance,
      annualPropertyTax: dto.annualPropertyTax,
      vacancyRate: dto.vacancyRate,
      maintenanceRate: dto.maintenanceRate,
      managementRate: dto.managementRate,
      capexRate: dto.capexRate,
      responseData: {
        KeyMetrics: {
          DSCR: Number(dscr.toFixed(2)),
          netOperatingIncome: Number(noi.toFixed(0)),
          monthlyCashFlow: Number(monthlyCashFlow.toFixed(2)),
          annualCashFlow: Number(annualCashFlow.toFixed(2)),
          capRate: Number(capRate.toFixed(2)),
          CashOnCashReturn: Number(coc.toFixed(2)),
          OnePercentRule: onePercentRule,

          // Section 8 specific
          section8Rent: Number(section8Rent.toFixed(0)),
          hudFmrRent: Number(fmrRent.toFixed(0)),
          hudCap: Number(hudCap.toFixed(0)),
          stabilityFactor,
          complianceCost,

          // Financing
          loanAmount: Number(loanAmount.toFixed(2)),
          monthlyMortgage: Number(monthlyMortgage.toFixed(2)),
          annualDebtService: Number(annualDebtService.toFixed(2)),
        },
        incomeExpance: {
          income: {
            section8Rent: Number(section8Rent.toFixed(2)),
            annualIncome: Number(annualIncome.toFixed(2)),
            effectiveIncome: Number(effectiveIncome.toFixed(2)),
          },
          expenses: { totalExpenses: Number(totalExpenses.toFixed(2)), complianceCost },
          noi: Number(noi.toFixed(0)),
          mortgage: {
            monthlyMortgage: Number(monthlyMortgage.toFixed(2)),
            annualDebtService: Number(annualDebtService.toFixed(2)),
          },
          netCashFlow: {
            monthly: Number(monthlyCashFlow.toFixed(2)),
            annual: Number(annualCashFlow.toFixed(2)),
          },
        },
        dealScoreboard: { totalScore, rating, breakdown },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY Section 8 endpoint (kept for backward compatibility)
  // @deprecated — use calculateSection8() instead
  // ═══════════════════════════════════════════════════════════════════════════

  async generateSection8_DSCR(dto: CreatePropertyDto) {
    const loanAmount = dto.purchasePrice - dto.downPayment;
    const monthlyRate = dto.interestRate / 100 / 12;
    const monthlyMortgage =
      (loanAmount * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -(dto.loanTerm * 12)));
    const annualDebtService = monthlyMortgage * 12;

    const hudCap = dto.monthlyRent * 1.05;
    const section8Rent = Math.min(dto.monthlyRent, hudCap);
    const annualIncome = section8Rent * 12;
    const stabilityFactor = 0.98;
    const effectiveIncome = annualIncome * stabilityFactor;

    const operatingExpenses =
      dto.annualPropertyTax + dto.annualInsurance + dto.annualUtilities + dto.annualOtherExpense;
    const maintenance = (dto.maintenanceRate / 100) * effectiveIncome;
    const management = (dto.managementRate / 100) * effectiveIncome;
    const capex = (dto.capexRate / 100) * effectiveIncome;
    const complianceCost = 600;
    const totalExpenses = operatingExpenses + maintenance + management + capex + complianceCost;

    const noi = effectiveIncome - totalExpenses;
    const riskFactor = 1.05;
    const riskAdjustedNOI = noi * riskFactor;
    const dscr = annualDebtService > 0 ? riskAdjustedNOI / annualDebtService : 0;
    const monthlyCashFlow = section8Rent - totalExpenses / 12 - monthlyMortgage;

    const score = dscr >= 1.25 ? 10 : dscr >= 1.1 ? 5 : 0;
    const rating = dscr >= 1.25 ? 'GOOD DEAL' : dscr >= 1.1 ? 'AVERAGE DEAL' : 'BAD DEAL';

    return {
      strategy: 'SECTION_8',
      stateAddress: dto.stateAddress,
      purchasePrice: dto.purchasePrice,
      downPayment: dto.downPayment,
      annualInsurance: dto.annualInsurance,
      annualPropertyTax: dto.annualPropertyTax,
      vacancyRate: dto.vacancyRate,
      maintenanceRate: dto.maintenanceRate,
      managementRate: dto.managementRate,
      responseData: {
        KeyMetrics: {
          DSCR: Number(dscr.toFixed(2)),
          netOperatingIncome: Number(noi.toFixed(0)),
          monthlyCashFlow: Number(monthlyCashFlow.toFixed(2)),
          section8Rent: Number(section8Rent.toFixed(0)),
          hudCap: Number(hudCap.toFixed(0)),
          stabilityFactor,
        },
        dealScoreboard: {
          totalScore: score,
          rating,
          breakdown: [
            {
              name: 'DSCR',
              value: Number(dscr.toFixed(2)),
              score,
              status: dscr >= 1.25 ? 'GOOD' : dscr >= 1.1 ? 'AVERAGE' : 'BAD',
            },
          ],
        },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATABASE CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllCalculationsForUser(userId: string, page: number = 1, limit: number = 10) {
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const skip = (currentPage - 1) * perPage;

    const total = await this.prisma.propertyCalculation.count({ where: { userId } });
    const records = await this.prisma.propertyCalculation.findMany({
      where: { userId },
      include: { breakdown: true },
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: records,
      meta: { total, page: currentPage, limit: perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getCalculationById(propertyId: string) {
    const record = await this.prisma.propertyCalculation.findUnique({
      where: { propertyId },
      include: { breakdown: true },
    });
    if (!record) throw new NotFoundException(`Calculation ${propertyId} not found`);
    return record;
  }

  async deleteCalculationById(propertyId: string, userId: string) {
    const record = await this.prisma.propertyCalculation.findUnique({
      where: { propertyId },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Record not found or you are not authorized to delete it.');
    }
    return this.prisma.propertyCalculation.delete({ where: { propertyId } });
  }

  // ─── Save BRRRR ────────────────────────────────────────────────────────────

  async saveBrrrProperty(userId: string, dto: CreateBrrrrDto) {
    const property = await this.prisma.propertyCalculation.create({
      data: {
        strategy: 'BRRRR',
        name: dto.name || 'Untitled Property',
        stateAddress: dto.stateAddress,
        purchasePrice: dto.purchasePrice,
        downPayment: dto.downPayment,
        annualInsurance: dto.annualInsurance,
        annualPropertyTax: dto.annualPropertyTax,
        vacancyRate: dto.vacancyRate,
        maintenanceRate: dto.maintenanceRate,
        managementRate: dto.managementRate,
        capexRate: dto.capexRate,
        allInCost: dto.allInCost_m,
        initialCashInvested: dto.initialCashInvested_m,
        monthlyNetCashFlow: dto.monthlyCashFlow_m,
        postRefiCoC: dto.postRefiCoC_m,
        cashOutAmount: dto.cashOutAmount_m,
        cashLeftInDeal: dto.cashLeftInDeal_m,
        equityCaptured: dto.equityCaptured_m,
        refinanceLoanAmount: dto.refinanceLoanAmount_m,
        capRate: dto.capRate_m,
        netOperatingIncome: dto.netOperatingIncome_m,
        dscr: dto.DSCR_m,
        userId,
        monthlyRent: dto.incomeExpance.income.monthlyRent,
        annualRent: dto.incomeExpance.income.annualRent,
        effectiveIncome: dto.incomeExpance.income.effectiveIncome,
        totalExpenses: dto.incomeExpance.expenses.totalExpenses,
        noi: dto.incomeExpance.noi,
        monthlyMortgage: dto.incomeExpance.mortgage.monthlyMortgage,
        annualMortgage: dto.incomeExpance.mortgage.annualMortgage,
        annualNetCashFlow: dto.incomeExpance.netCashFlow.annual,
        purchaseLoanAmount: dto.incomeExpance.financing.purchaseLoanAmount,
        loanPointsCost: dto.incomeExpance.financing.loanPointsCost,
        totalScore: dto.dealScoreboard.totalScore,
        scoreBoardStatus: dto.dealScoreboard.rating,
      },
    });

    if (dto.dealScoreboard.breakdown.length > 0) {
      await this.prisma.scoreBreakdown.createMany({
        data: dto.dealScoreboard.breakdown.map((item: any) => ({
          propertyId: property.propertyId,
          name: item.name,
          value: typeof item.value === 'boolean' ? (item.value ? 1 : 0) : item.value,
          score: item.score,
          status: item.status,
        })),
      });
    }

    return { message: 'BRRRR Property saved successfully', data: property };
  }

  // ─── Save Turnkey ──────────────────────────────────────────────────────────

  async saveTurnkeyProperty(userId: string, dto: CreateTurnkeyDTO_Mod) {
    const property = await this.prisma.propertyCalculation.create({
      data: {
        strategy: 'TURNKEY',
        name: dto.name || 'Untitled Property',
        stateAddress: dto.stateAddress,
        purchasePrice: dto.purchasePrice,
        downPayment: dto.downPayment,
        annualInsurance: dto.annualInsurance,
        annualPropertyTax: dto.annualPropertyTax,
        vacancyRate: dto.vacancyRate,
        maintenanceRate: dto.maintenanceRate,
        managementRate: dto.managementRate,
        capexRate: dto.capexRate,
        userId,
        allInCost: dto.responseData?.KeyMetrics?.allInCost,
        initialCashInvested: dto.responseData?.KeyMetrics?.initialCashInvested,
        monthlyNetCashFlow: dto.responseData?.KeyMetrics?.monthlyCashFlow,
        cashOnCashReturn: dto.responseData?.KeyMetrics?.CashOnCashReturn,
        capRate: dto.responseData?.KeyMetrics?.capRate,
        dscr: dto.responseData?.KeyMetrics?.DSCR,
        onePercentRule: dto.responseData?.KeyMetrics?.OnePercentRule,
        netOperatingIncome: dto.responseData?.KeyMetrics?.netOperatingIncome,
        purchaseLoanAmount: dto.responseData?.KeyMetrics?.loanAmount,
        loanPointsCost: dto.responseData?.KeyMetrics?.loanPointsCost,
        lenderFees: dto.responseData?.KeyMetrics?.lenderFees,
        noi: dto.responseData?.incomeExpance?.noi,
        monthlyMortgage: dto.responseData?.incomeExpance?.mortgage?.monthlyMortgage,
        annualMortgage: dto.responseData?.incomeExpance?.mortgage?.annualMortgage,
        annualNetCashFlow: dto.responseData?.incomeExpance?.netCashFlow?.annual,
        scoreBoardStatus: dto.responseData?.dealScoreboard?.rating,
        totalScore: dto.responseData?.dealScoreboard?.totalScore,
      },
    });

    if (dto.responseData.dealScoreboard.breakdown.length > 0) {
      await this.prisma.scoreBreakdown.createMany({
        data: dto.responseData.dealScoreboard.breakdown.map((item: any) => ({
          propertyId: property.propertyId,
          name: item.name,
          value: typeof item.value === 'boolean' ? (item.value ? 1 : 0) : item.value,
          score: item.score,
          status: item.status,
        })),
      });
    }

    return { message: 'Turnkey Property saved successfully', data: property };
  }

  // ─── Save Section 8 ────────────────────────────────────────────────────────

  async saveSection8Property(userId: string, dto: Section8RequestDto) {
    const property = await this.prisma.propertyCalculation.create({
      data: {
        strategy: 'SECTION_8',
        name: dto.name || 'Untitled Property',
        stateAddress: dto.stateAddress,
        purchasePrice: dto.purchasePrice,
        downPayment: dto.downPayment,
        annualInsurance: dto.annualInsurance,
        annualPropertyTax: dto.annualPropertyTax,
        vacancyRate: dto.vacancyRate,
        maintenanceRate: dto.maintenanceRate,
        managementRate: dto.managementRate,
        capexRate: dto.capexRate,
        userId,
        dscr: dto.responseData?.KeyMetrics?.DSCR,
        netOperatingIncome: dto.responseData?.KeyMetrics?.netOperatingIncome,
        monthlyNetCashFlow: dto.responseData?.KeyMetrics?.monthlyCashFlow,
        annualNetCashFlow: dto.responseData?.KeyMetrics?.annualCashFlow,
        capRate: dto.responseData?.KeyMetrics?.capRate,
        cashOnCashReturn: dto.responseData?.KeyMetrics?.CashOnCashReturn,
        onePercentRule: dto.responseData?.KeyMetrics?.OnePercentRule,
        monthlyRent: dto.responseData?.KeyMetrics?.section8Rent,
        hudCap: dto.responseData?.KeyMetrics?.hudCap,
        stabilityFactor: dto.responseData?.KeyMetrics?.stabilityFactor,
        purchaseLoanAmount: dto.responseData?.KeyMetrics?.loanAmount,
        monthlyMortgage: dto.responseData?.KeyMetrics?.monthlyMortgage,
        annualMortgage: dto.responseData?.KeyMetrics?.annualDebtService,
        noi: dto.responseData?.incomeExpance?.noi,
        totalExpenses: dto.responseData?.incomeExpance?.expenses?.totalExpenses,
        annualRent: dto.responseData?.incomeExpance?.income?.annualIncome,
        effectiveIncome: dto.responseData?.incomeExpance?.income?.effectiveIncome,
        scoreBoardStatus: dto.responseData?.dealScoreboard?.rating,
        totalScore: dto.responseData?.dealScoreboard?.totalScore,
      },
    });

    if (dto.responseData.dealScoreboard.breakdown.length > 0) {
      await this.prisma.scoreBreakdown.createMany({
        data: dto.responseData.dealScoreboard.breakdown.map((item: any) => ({
          propertyId: property.propertyId,
          name: item.name,
          value: typeof item.value === 'boolean' ? (item.value ? 1 : 0) : item.value,
          score: item.score,
          status: item.status,
        })),
      });
    }

    return { message: 'Section 8 Property saved successfully', data: property };
  }
}
