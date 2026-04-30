# Surcharge and Marginal Relief Implementation Plan

## Background & Research Findings

Based on Indian Income Tax laws (applicable for FY 2024-25 and FY 2025-26):
1. **Surcharge** is levied on the computed income tax when the **Net Taxable Income** exceeds certain thresholds.
   - > ₹50 Lakhs to ₹1 Crore: **10%**
   - > ₹1 Crore to ₹2 Crore: **15%**
   - > ₹2 Crore to ₹5 Crore: **25%**
   - > ₹5 Crore: **25%** (New Regime) / **37%** (Old Regime)
2. **Marginal Relief** ensures that when taxable income slightly exceeds a surcharge threshold, the additional tax liability (tax + surcharge) does not exceed the actual income earned above that threshold. 
   - *Formula:* `Marginal Relief = (Tax on Actual Income + Surcharge) - (Tax on Threshold Income) - (Actual Income - Threshold Income)`
   - If this value is positive, it is subtracted from the total tax (before Cess).
3. **Age Limit Influence:** 
   - Age does **not** change the Surcharge slabs or Marginal Relief formula.
   - However, under the **Old Tax Regime**, age affects the basic exemption limits, which alters the base tax calculation (and consequently the marginal relief threshold calculation):
     - **< 60 years:** Basic exemption ₹2.5 Lakhs
     - **60 to 79 years (Senior Citizen):** Basic exemption ₹3 Lakhs
     - **80+ years (Super Senior Citizen):** Basic exemption ₹5 Lakhs
   - Under the **New Tax Regime**, the basic exemption is uniform regardless of age.
4. **Health and Education Cess (4%)** is always calculated on the final tax amount *after* adding surcharge and subtracting marginal relief.

---

## Resolved Decisions

| Question | Decision |
| :--- | :--- |
| **Q1 — Employee Age Input** | Add `dob` (Date of Birth) to the employee schema/state and compute age dynamically based on the current financial year. Add a DOB input in the Simulation tab. |
| **Q2 — Surcharge Limits on Special Incomes** | Stick to standard salary income surcharge rates; ignore special 15% caps as capital gains are handled outside payroll TDS. |

## New Additions

### 1. Income from Other Sources & Previous Employer TDS
To provide a comprehensive tax calculation:
- **Income from Other Sources (`incomeFromOtherSources`)**: This amount will be added directly to the total `annualGross` before calculating the tax liability. This ensures that the base tax and surcharge are correctly elevated.
- **Previous Employer TDS (`previousEmployerTDS`)**: This amount will be factored into the TDS recovery logic. 
  - *Formula Update:* `Remaining Deficit = Annual Tax - (Current YTD Tax + Previous Employer TDS)`
  - This ensures the current employer does not over-deduct tax if the previous employer already deducted a portion of the annual liability.

### 2. Database Schema Changes (Supabase SQL)
To support the new `dob` field persistently, a database column needs to be added. The `incomeFromOtherSources` and `previousEmployerTDS` will be saved within the `adjustments` or `taxOverrides` JSONB column (similar to 80C investments), so no specific schema columns are needed for those.

```sql
-- Add Date of Birth to employees for age-based tax computations
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS dob DATE;
```

---

## Proposed Changes

### 1. `src/data/payrollEngine.js`

#### [MODIFY] `evaluateTaxLiability`
- **Add `age` parameter** (defaulting to 30) to the function signature.
- **Old Regime Slab Updates:** Update the base tax calculation for `taxRegime === 'old'` to account for the age-based exemption limits (₹2.5L, ₹3L for age 60-79, ₹5L for age 80+) and calculate the correct `baseTax`.
- **Surcharge & Marginal Relief Calculation:**
  - Introduce a helper logic block to determine the surcharge rate based on `taxableIncome` and `taxRegime`.
  - Calculate `taxWithSurcharge = baseTax + (baseTax * surchargeRate)`.
  - Check for **Marginal Relief** if income is above a threshold (50L, 1Cr, 2Cr, 5Cr):
    - Calculate the base tax exactly *at* the crossed threshold.
    - Calculate the surcharge at the lower bracket rate for that threshold tax.
    - Calculate `extraTax = taxWithSurcharge - taxAtThreshold`.
    - Calculate `extraIncome = taxableIncome - threshold`.
    - If `extraTax > extraIncome`, then `marginalRelief = extraTax - extraIncome`.
  - Final tax before cess = `taxWithSurcharge - marginalRelief`.
- **Cess:** Apply the 4% Cess on the final tax before cess.
- Update `taxFormulaDetail` to stringify the surcharge and marginal relief components for the UI.

#### [MODIFY] `computeEmployeePayroll`
- Add `incomeFromOtherSources` to `annualGross` before calling `evaluateTaxLiability`.
- Calculate the employee's `age` using `dob` (against the `payrollYear`) or pass a default age of 30 if `dob` is missing.
- Pass `age` into the `evaluateTaxLiability` call.
- Update TDS deduction formula: `remainingTax = Math.max(0, annualTax - (tdsDeductedSoFar + previousEmployerTDS))`

### 2. `src/components/simulations/SimulationsTab.jsx`

#### [MODIFY] `SimulationsTab` state
- Add `dob: '1990-01-01'`, `incomeFromOtherSources: 0`, and `previousEmployerTDS: 0` to the initial state and populate from `emp` / `taxOverrides`.

### 3. `src/components/simulations/Step2_Tax.jsx`

#### [MODIFY] `Step2_Tax` component
- Add inputs for **Date of Birth**, **Income from Other Sources**, and **Previous Employer TDS**.
- Ensure the `taxFormulaDetail` correctly renders the surcharge and marginal relief lines.

### 4. `src/components/payroll/PayrollOps_Tax.jsx`

#### [MODIFY] `TaxCard` & `TaxReportModal`
- Add inputs for **Income from Other Sources** and **Previous Employer TDS** in the IT Declaration section.
- Add an indicator if Surcharge and Marginal Relief are applied in the `TaxReportModal`.
- Show `incomeFromOtherSources` added to `annualGross` and `previousEmployerTDS` in the TDS logic section.

---

## Verification Plan

### Automated Tests (Mental/Manual Checks)
- **Scenario 1:** Income = ₹50,00,000. Surcharge = 0%.
- **Scenario 2:** Income = ₹51,00,000. Surcharge = 10%. Extra income = ₹1L. Extra tax with 10% surcharge > ₹1L. Marginal relief should trigger and cap the tax increase to exactly ₹1L.
- **Scenario 3:** Senior Citizen (Age 65) under Old Regime with ₹6 Lakhs income. Should calculate base tax with ₹3L exemption limit instead of ₹2.5L.
- **Scenario 4:** Super Senior Citizen (Age 82) under Old Regime with ₹6 Lakhs income. Should calculate base tax with ₹5L exemption limit.

### Manual UI Verification
- Enter a high salary (> ₹50L) in the simulator and verify the tax breakdown displays the Surcharge and Marginal Relief.
- Toggle tax regimes and change DOB (to age > 60 and > 80) to ensure the Surcharge and old regime exemptions work correctly.
- Add ₹50k as "Previous Employer TDS" and verify the monthly TDS target drops appropriately.
- Add ₹2L as "Income from Other Sources" and verify the `taxableIncome` and final `annualTax` increase accordingly.
