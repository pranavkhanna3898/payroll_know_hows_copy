# Backend Logics & Tax Rules
**Reference:** `src/data/payrollEngine.js`

This document serves as the absolute technical arbiter of mathematics defining the backend formulas for statutory and taxation deductions utilized in the Indian Payroll System.

---

## 1. Salary Proration
Used in scenarios of Loss of Pay (LOP) or partial month joiners.
- **Base Variable ($M$):** `30` (Assumed constant for standardized calculation, barring exact strict calendar methodologies).
- **Attendance Factor ($A$):** `(M - LOP) / M`
- **Prorated Formula:** 
  `Component Payout = Component Base Amount * A`

**Exception:** Variable bonuses or pre-fixed reimbursement claims do **NOT** undergo LOP proration, as they reflect a flat monthly payout dynamic.

---

## 2. Statutory Components Rules

### 2.1 Provident Fund (EPF)
The EPF algorithm pivots linearly depending on the company's global configuration map (`epfCalculationMethod`).

**Standard Logic (Prorated Ceiling):**
- Applicable Ceiling Base = `min((Basic * A), 15000 * A)`
- Standard Deduction = `Applicable Ceiling Base * 0.12` (12%)
- Capping behavior guarantees a max deduction of ₹1,800/mo (unless Uncapped logic is explicitly invoked).

**Employer Share Split:**
- EPS (Pension) = `Ceiling Base * 0.0833`
- EPF (Provident Fund) = `(Ceiling Base * 0.12) - EPS`

### 2.2 Employee State Insurance (ESI)
- **Eligibility Trigger:** If Total Gross Payout (Base + Allowances) `<=` ₹21,000 for the localized period.
- **Employee Share:** `Total Gross Payout * 0.0075` (0.75%)
- **Employer Share:** `Total Gross Payout * 0.0325` (3.25%)
- *Note:* If gross crosses ₹21,000 mid-period, ESI persists generally until the next compliance cycle, though the system tracks it monthly.

### 2.3 Professional Tax (PT)
PT logic dynamically parses the `work_state` property and maps it to slab requirements.
**Example Configurations:**
- **Maharashtra (MH):** Gross >= ₹10,000 -> ₹200 (except Feb: ₹300). Women <= ₹25k are exempt natively inside the schema matrices.
- **Karnataka (KA):** Gross >= ₹15,000 -> ₹200.
*If the state does not levy PT (e.g., Delhi, Haryana), deduction enforces ₹0 algorithmically.*

### 2.4 Labour Welfare Fund (LWF)
Calculated half-yearly or monthly based entirely on state compliance strings.
- Example: **Tamil Nadu (TN):** Computed annually but amortized or charged explicitly in specific months (e.g., ₹20 EE, ₹40 ER).

---

## 3. Taxation Regimes (TDS Computation)

### 3.1 The "New" Tax Regime (Default)
**Key Characteristic:** Offers lower unified tax slabs but strictly forfeits Chapter VI-A inferences (80C, 80D, HRA exceptions, Sec 24).
- **Standard Deduction:** ₹50,000 applied unconditionally.
- **Sec 87A Rebate:** If Annual Taxable Income <= ₹7,00,000, Tax evaluates strictly to `0`.
**Slabs (Approx FY24-25):**
| Condition | Value |
| :--- | :--- |
| ₹0 to ₹3,00,000 | 0% |
| ₹3,00,001 to ₹6,00,000 | 5% |
| ₹6,00,001 to ₹9,00,000 | 10% |
| ₹9,00,001 to ₹12,00,000 | 15% |
| ₹12,00,001 to ₹15,00,000 | 20% |
| > ₹15,00,000 | 30% |

- **Health & Education Cess:** Extra `4%` mapped strictly onto the calculated base tax.

### 3.2 The "Old" Tax Regime
**Key Characteristic:** Retains all tax-saving declarations from the Finance Validation Dashboard.
**Deduction Capping Matrix Evaluated Before Slabs:**
- `Max(80C)` = ₹1,50,000 (PPF, ELSS, EPF Employee Share)
- `Max(80D Self)` = ₹25,000
- `Max(80D Parents)` = ₹25,000 (₹50,000 if Senior Citizen flag is true).
- `Max(NPS 80CCD(1B))` = ₹50,000
- `Max(Home Loan Sec 24)` = ₹2,00,000
- `Max(80TTA)` = ₹10,000
- Standard Deduction = ₹50,000
- **HRA Exemption Formula:** Minimum of the following three:
  1. Actual HRA received.
  2. 50% of Basic (Metro) or 40% of Basic (Non-Metro).
  3. Actual Rent Paid minus 10% of Basic.

**Slabs (Approx FY24-25):**
| Condition | Value |
| :--- | :--- |
| ₹0 to ₹2,50,000 | 0% |
| ₹2,50,001 to ₹5,00,000 | 5% |
| ₹5,00,001 to ₹10,00,000 | 20% |
| > ₹10,00,000 | 30% |

- **Sec 87A Rebate:** Total Taxable Income <= ₹5,00,000 maps to ₹0 tax liability.

### 3.3 TDS Monthly Yield Allocation
- Standard formula assesses: `Monthly TDS = (Computed Annual Tax - Paid YTD TDS) / Remaining Months in FY`.
- Tax scheduling tags (e.g., Variable bonuses queued for "year_end" processing) are bifurcated or omitted from monthly recurring TDS tracking dynamically depending on `taxSchedule` mapping.

---

> [!CAUTION]
> The Finance Verification tab guarantees that the values injected into the `payrollEngine` are pre-clamped. Any direct backend manipulation bypassing the `FinanceVerificationTab.jsx` verification rules poses an integrity risk and will create TDS variance.
