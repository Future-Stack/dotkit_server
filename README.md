# Analyzer API Changes Report

This document outlines all modifications made to the Request (DTO) and Response payloads for the BRRRR, Turnkey, and Section 8 API endpoints. 

---

## 1. BRRRR (`/property/calculate-brrrr`)

### Request Changes (DTO)
- **[NEW] `rehabDurationMonths`**: Added as an optional number. If provided, the calculator will dynamically multiply your `holdingCost` by this duration. If omitted, it gracefully defaults to `1` to avoid breaking existing integrations.
- **`holdingCost`**: Clarified in the API documentation that this now represents a *monthly* holding cost during the rehab period.

### Response Changes
- **Structure**: No structural changes to the JSON schema.
- **Logic Update**: `allInCost` and `initialCashInvested` will now correctly include the multiplied holding costs (e.g., `holdingCost * rehabDurationMonths`).

---

## 2. Turnkey (`/property/calculate-turnkey`)

### Request Changes (DTO)
- **[REMOVED] `marketRent`**: Completely removed from the request body as requested. All calculations are now strictly driven by `monthlyRent`.

### Response Changes
- **[NEW] `incomeExpance.income`**: Added to the response. It contains:
  - `monthlyRent`
  - `annualRent`
  - `effectiveIncome`
- **[NEW] `incomeExpance.expenses`**: Added to the response. It contains:
  - `totalExpenses`
- **[NEW] `incomeExpance.financing`**: Added to the response. It contains standard purchase loan data so your frontend can drop the "Refinance" wording:
  - `purchaseLoanAmount`
  - `loanPointsCost`
  - `lenderFees`
- **Deal Scorecard**:
  - Removed the "Rent vs Market" row.
  - The "Crime Score" row now mathematically scales from 0-10 on a linear trajectory (e.g., a crime score of 95 returns 10/10 points).

---

## 3. Section 8 (`/property/calculate-section8`)

### Request Changes (DTO)
- **[NEW] `crimeScore`**: Added as an optional number so it can be rendered on the Deal Scorecard.

### Response Changes
- **Variable Renames (to perfectly sync with Turnkey/BRRRR frontend cards)**:
  - `incomeExpance.income.section8Rent` ➡️ renamed to `incomeExpance.income.monthlyRent`
  - `incomeExpance.income.annualIncome` ➡️ renamed to `incomeExpance.income.annualRent`
  - `incomeExpance.mortgage.annualDebtService` ➡️ renamed to `incomeExpance.mortgage.annualMortgage`
- **[NEW] `incomeExpance.financing`**: Added to the response so the UI cards don't show $0.00:
  - `purchaseLoanAmount`
  - `loanPointsCost` (Defaults to 0)
  - `lenderFees` (Defaults to 0)
- **Deal Scorecard**:
  - Values are now returned as pure Numbers instead of Strings to fix the frontend UI crash/rendering issues.
  - Added the "Crime Score" row.
  - Row order updated to exactly match the Turnkey array layout.
- **Logic Update**: Added fallback safeties (`|| 0`) to all expense math to guarantee that if inputs like Property Tax are left blank, it calculates as $0 rather than corrupting the NOI and Cash Flow with `NaN`.
