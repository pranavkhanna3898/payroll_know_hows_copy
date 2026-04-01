import { useState, useMemo } from "react";

const STATES = [
  { code: "MH", name: "Maharashtra" },
  { code: "KA", name: "Karnataka" },
  { code: "WB", name: "West Bengal" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "GJ", name: "Gujarat" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "TG", name: "Telangana" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "OD", name: "Odisha" },
  { code: "DL", name: "Delhi (NCT)" },
  { code: "HR", name: "Haryana" },
  { code: "PB", name: "Punjab" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "RJ", name: "Rajasthan" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "CH", name: "Chhattisgarh" },
  { code: "AS", name: "Assam" },
  { code: "GO", name: "Goa" },
  { code: "MN", name: "Manipur" },
  { code: "MG", name: "Meghalaya" },
  { code: "TR", name: "Tripura" },
  { code: "SK", name: "Sikkim" },
  { code: "MZ", name: "Mizoram" },
];

// Status codes: M=Mandatory, V=Variable/Slab, O=Optional, N=Not Applicable, C=Conditional
const STATUS = {
  M: { label: "Mandatory", color: "#16a34a", bg: "#dcfce7", symbol: "✓" },
  V: { label: "Slab/Varies", color: "#d97706", bg: "#fef3c7", symbol: "~" },
  O: { label: "Optional", color: "#2563eb", bg: "#dbeafe", symbol: "○" },
  N: { label: "Not Applicable", color: "#9ca3af", bg: "#f3f4f6", symbol: "✗" },
  C: { label: "Conditional", color: "#7c3aed", bg: "#ede9fe", symbol: "◈" },
};

const CATEGORIES = [
  {
    id: "statutory_deductions",
    name: "Statutory Deductions",
    color: "#dc2626",
    components: [
      {
        id: "epf_ee",
        name: "EPF — Employee (12%)",
        base: "Basic + DA",
        formula: "12% × (Basic + DA); capped at ₹15,000 if opted",
        taxNote: "80C deductible; interest tax-free up to ₹2.5L p.a.",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform across all states; governed by EPF Act 1952. Threshold: 20+ employees.",
      },
      {
        id: "esi_ee",
        name: "ESI — Employee (0.75%)",
        base: "Gross Wages",
        formula: "0.75% × Gross Wages; only if Gross ≤ ₹21,000/month",
        taxNote: "No specific tax deduction for employee",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform rate; applicable in ESI-notified areas (596+ districts). Coverage expands periodically.",
      },
      {
        id: "pt",
        name: "Professional Tax (PT)",
        base: "Monthly Gross (varies by state)",
        formula: "Slab-based per state law; max ₹2,500/year",
        taxNote: "Deductible u/s 16(iii) of Income Tax Act",
        states: { MH:"V",KA:"V",WB:"V",TN:"V",GJ:"V",AP:"V",TG:"V",KL:"V",MP:"V",OD:"V",DL:"N",HR:"N",PB:"N",UP:"N",RJ:"N",HP:"N",JH:"V",CH:"V",AS:"V",GO:"V",MN:"V",MG:"V",TR:"V",SK:"V",MZ:"V" },
        notes: "~20 states have PT. Delhi, UP, Rajasthan, Haryana, Punjab, HP have NO PT. Frequency varies: monthly, quarterly, half-yearly, or annually by state.",
      },
      {
        id: "lwf_ee",
        name: "LWF — Employee",
        base: "State-specific",
        formula: "Nominal fixed amounts; ₹3 to ₹48 per contribution period",
        taxNote: "No specific tax deduction",
        states: { MH:"V",KA:"V",WB:"M",TN:"V",GJ:"V",AP:"V",TG:"V",KL:"M",MP:"V",OD:"M",DL:"M",HR:"M",PB:"V",UP:"N",RJ:"N",HP:"N",JH:"V",CH:"V",AS:"V",GO:"M",MN:"N",MG:"N",TR:"N",SK:"N",MZ:"N" },
        notes: "~18 states have LWF. Rajasthan, HP, UP have no LWF. Frequency: monthly (WB, KL, OD, GO), semi-annual (MH), annual (KA, TN, AP, TG, MP).",
      },
      {
        id: "tds",
        name: "TDS on Salary",
        base: "Annual Taxable Income",
        formula: "Old Regime: 5%/20%/30% slabs; New Regime: 5%/10%/15%/20%/30% slabs + 4% cess",
        taxNote: "IS the tax — Form 24Q quarterly return; Form 16 annually",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform across all states; central legislation. Employee chooses Old or New regime each year.",
      },
      {
        id: "vpf",
        name: "Voluntary PF (VPF)",
        base: "Basic + DA",
        formula: "Employee-chosen %; added to EPF 12%; employer not required to match",
        taxNote: "80C deductible; interest on total PF > ₹2.5L/year taxable",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Optional for all states. Employee may choose any % in addition to the mandatory 12%.",
      },
      {
        id: "loan_emi",
        name: "Loan / Advance Recovery",
        base: "Per sanction letter",
        formula: "EMI = Principal / Tenure + Interest; per approved schedule",
        taxNote: "Housing loan interest: 80EEA / 24(b); Education: 80E; Others: no deduction",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "Applicable only if employee has an outstanding loan/advance. Policy-driven.",
      },
    ],
  },
  {
    id: "employer_contributions",
    name: "Employer Contributions (CTC)",
    color: "#7c3aed",
    components: [
      {
        id: "epf_er",
        name: "EPF Employer (3.67%)",
        base: "Basic + DA",
        formula: "3.67% × (Basic + DA); goes into employee's EPF account",
        taxNote: "Tax-free in employer's hands; part of CTC",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform. Total employer EPF+EPS = 12%; split as EPF 3.67% + EPS 8.33% (max ₹1,250/month).",
      },
      {
        id: "eps_er",
        name: "EPS Employer (8.33%)",
        base: "Basic + DA (max ₹15,000)",
        formula: "8.33% × PF Wage; max ₹1,250/month; goes to Pension Fund",
        taxNote: "Not taxable",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Max EPS = ₹1,250/month (8.33% of ₹15,000). Higher EPS for pre-2014 employees who opted.",
      },
      {
        id: "edli_er",
        name: "EDLI Employer (0.50%)",
        base: "Basic + DA",
        formula: "0.50% × PF Wage; max ₹75/month; death insurance",
        taxNote: "Not taxable to employee",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Max EDLI benefit to nominee: ₹7 lakh.",
      },
      {
        id: "epf_admin",
        name: "EPF Admin Charges (0.50%)",
        base: "Basic + DA",
        formula: "0.50% × PF Wage; min ₹500/month; EPFO levy",
        taxNote: "Employer expense; not on payslip",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Reduced from 0.85% to 0.50% (April 2017). Minimum ₹500/month even if calculated amount is lower.",
      },
      {
        id: "esi_er",
        name: "ESI Employer (3.25%)",
        base: "Gross Wages",
        formula: "3.25% × Gross Wages; only if Gross ≤ ₹21,000/month",
        taxNote: "Employer expense",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform 3.25% (reduced from 4.75% in July 2019). Total ESI = 4% of gross.",
      },
      {
        id: "lwf_er",
        name: "LWF — Employer",
        base: "State-specific",
        formula: "Usually 2× employee contribution; nominal amounts",
        taxNote: "Employer expense",
        states: { MH:"V",KA:"V",WB:"M",TN:"V",GJ:"V",AP:"V",TG:"V",KL:"M",MP:"V",OD:"M",DL:"M",HR:"M",PB:"V",UP:"N",RJ:"N",HP:"N",JH:"V",CH:"V",AS:"V",GO:"M",MN:"N",MG:"N",TR:"N",SK:"N",MZ:"N" },
        notes: "Mirrors employee LWF contribution (usually double). State-specific amounts and frequency.",
      },
      {
        id: "gratuity_prov",
        name: "Gratuity Provision",
        base: "Basic + DA",
        formula: "4.81% × (Basic + DA) monthly provision; or actuarial valuation (Ind AS 19)",
        taxNote: "Deductible when actually paid; provision not immediately deductible",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform Act; same formula everywhere. 5-year vesting (no waiting for death/disability). Max ₹20 lakh.",
      },
      {
        id: "bonus_prov",
        name: "Bonus Provision",
        base: "Basic (max ₹7,000/month or min wage)",
        formula: "8.33% min; 20% max of annual bonus wage based on allocable surplus",
        taxNote: "Deductible when paid; provision may not be deductible",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Payment of Bonus Act uniform. Eligibility: salary ≤ ₹21,000/month. Min 30 working days per year.",
      },
      {
        id: "nps_er",
        name: "NPS Employer Contribution",
        base: "Basic + DA",
        formula: "Up to 10% of Basic+DA (private); 14% for Govt. Exempt u/s 80CCD(2)",
        taxNote: "Reduces employee taxable income; no tax for employer up to 10%/14%",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Optional but highly tax-efficient. Available in both Old and New tax regime. No upper limit on employer contribution; only exemption is capped at 10%.",
      },
    ],
  },
  {
    id: "fixed_earnings",
    name: "Fixed Earnings",
    color: "#0369a1",
    components: [
      {
        id: "basic",
        name: "Basic Salary",
        base: "CTC %",
        formula: "40–50% of CTC or per grade band",
        taxNote: "Fully taxable; PF, Gratuity, Bonus base",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Minimum Basic must satisfy minimum wage laws. Generally kept ≥ minimum wage for the applicable state and skill category.",
      },
      {
        id: "da",
        name: "Dearness Allowance (DA)",
        base: "Basic Salary or CPI Index",
        formula: "Govt: linked to AICPI; Private: usually nil or fixed %",
        taxNote: "Fully taxable; included in PF and Gratuity base",
        states: { MH:"V",KA:"V",WB:"V",TN:"V",GJ:"V",AP:"V",TG:"V",KL:"V",MP:"V",OD:"V",DL:"V",HR:"V",PB:"V",UP:"V",RJ:"V",HP:"V",JH:"V",CH:"V",AS:"V",GO:"V",MN:"V",MG:"V",TR:"V",SK:"V",MZ:"V" },
        notes: "Mainly for government employees. Private companies often merge DA into Basic or ignore it entirely.",
      },
      {
        id: "hra",
        name: "HRA (House Rent Allowance)",
        base: "Basic Salary",
        formula: "Metro: 50% of Basic; Non-metro: 40% of Basic (typical)",
        taxNote: "Partial exempt u/s 10(13A): min of (actual HRA, rent paid−10% Basic, 50%/40% of Basic)",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Metro cities (Delhi, Mumbai, Kolkata, Chennai): 50% exemption. All others: 40%. Employee must pay actual rent; if staying with family: no exemption. Landlord PAN needed if annual rent > ₹1 lakh.",
      },
      {
        id: "lta",
        name: "LTA (Leave Travel Allowance)",
        base: "Actual Fare",
        formula: "Company provides fixed amount; exemption = actual fare (domestic; family; economy/AC1)",
        taxNote: "Exempt u/s 10(5); 2 journeys in 4-year block; unused exemption carries forward",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Central exemption rule; same in all states. Current block: 2022–2025. Only transport fares exempt (no hotel, food). Family = spouse, children (max 2 born after Oct 1998), dependent parents/siblings.",
      },
      {
        id: "med_allowance",
        name: "Medical Allowance (Fixed)",
        base: "Fixed amount",
        formula: "Fixed ₹1,250/month or per company policy",
        taxNote: "Fully taxable (post-2018); subsumed under Standard Deduction",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "The ₹15,000/year medical exemption was removed in 2018 and replaced by Standard Deduction. Now fully taxable.",
      },
      {
        id: "conveyance",
        name: "Conveyance Allowance (Fixed)",
        base: "Fixed amount",
        formula: "Fixed ₹1,600/month or per company policy",
        taxNote: "Fully taxable (post-2018); subsumed under Standard Deduction",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "The ₹1,600/month exemption was removed in 2018; now taxable. Companies still pay as a component but it's taxable.",
      },
      {
        id: "special_allowance",
        name: "Special Allowance",
        base: "Residual (CTC - other components)",
        formula: "Special = CTC - Basic - HRA - LTA - PF - Gratuity - all other fixed components",
        taxNote: "Fully taxable",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Balancing component; ensures CTC = total package. Most common way to flex the package.",
      },
      {
        id: "cca",
        name: "City Compensatory Allowance (CCA)",
        base: "Grade + City tier",
        formula: "Fixed by HR policy; typically ₹500–₹3,000/month based on city tier",
        taxNote: "Fully taxable",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Metro and Tier-1 cities get higher CCA. Companies in IT/ITES commonly pay this.",
      },
      {
        id: "cea",
        name: "Children Education Allowance",
        base: "Per child per month",
        formula: "₹100/child/month × max 2 children = max ₹2,400/year",
        taxNote: "Exempt u/s 10(14): ₹100/child/month; excess taxable",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Exemption uniform across all states u/s 10(14). Hostel subsidy: ₹300/child/month (max 2). Combined max exempt = ₹2,400 + ₹7,200 = ₹9,600/year.",
      },
      {
        id: "night_shift",
        name: "Night Shift / Shift Allowance",
        base: "Per shift or fixed",
        formula: "Fixed amount per night shift or percentage of daily wages",
        taxNote: "Fully taxable",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "More common in IT, BPO, manufacturing. Some states mandate premium for night shifts under state S&E Acts.",
      },
    ],
  },
  {
    id: "variable_earnings",
    name: "Variable Earnings",
    color: "#0891b2",
    components: [
      {
        id: "perf_bonus",
        name: "Performance / Variable Bonus",
        base: "KPI, grade, company performance",
        formula: "% of Annual CTC × Achievement Factor; paid quarterly/annually",
        taxNote: "Fully taxable in year of receipt; ESI included if monthly",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Tax relief u/s 89(1) if arrears of prior year. Separate from statutory bonus (Payment of Bonus Act).",
      },
      {
        id: "overtime",
        name: "Overtime Wages",
        base: "Ordinary hourly rate",
        formula: "2 × Ordinary Rate × OT hours (Factories Act); rate may differ under other Acts",
        taxNote: "Fully taxable; included in ESI gross",
        states: { MH:"V",KA:"V",WB:"V",TN:"V",GJ:"V",AP:"V",TG:"V",KL:"V",MP:"V",OD:"V",DL:"V",HR:"V",PB:"V",UP:"V",RJ:"V",HP:"V",JH:"V",CH:"V",AS:"V",GO:"V",MN:"V",MG:"V",TR:"V",SK:"V",MZ:"V" },
        notes: "Factories Act mandates 2× rate. Shops & Establishments Acts vary by state. Some states (e.g., Maharashtra) have specific OT caps and records requirements.",
      },
      {
        id: "stat_bonus",
        name: "Statutory Bonus (Bonus Act)",
        base: "Monthly wages capped at ₹7,000 or min wage",
        formula: "Min 8.33% to Max 20% of annual eligible wages; based on allocable surplus",
        taxNote: "Fully taxable in year of receipt",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Uniform under Payment of Bonus Act 1965. Paid within 8 months of FY close. Eligibility: salary ≤ ₹21,000/month AND ≥ 30 working days in the year.",
      },
      {
        id: "joining_bonus",
        name: "Joining / Sign-on Bonus",
        base: "Negotiated",
        formula: "One-time; often with clawback if resign within 1 year",
        taxNote: "Fully taxable; perquisite if clawback enforced",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "No statutory basis; purely company policy. Taxable in year of receipt.",
      },
    ],
  },
  {
    id: "reimbursements",
    name: "Reimbursements & Claims",
    color: "#059669",
    components: [
      {
        id: "fuel_reimb",
        name: "Fuel / Conveyance Reimbursement",
        base: "Bills / logbook",
        formula: "Own car ≤1600cc: ₹1,800/month + ₹900 (driver); >1600cc: ₹2,400 + ₹900",
        taxNote: "Partially exempt per Rule 3(e); excess taxable as perquisite",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Must be for official duty travel. Logbook/bills required. Same exemption amounts across all states.",
      },
      {
        id: "mobile_reimb",
        name: "Mobile / Phone Reimbursement",
        base: "Actual bills",
        formula: "Actual telephone bills for official use; proportionate official use",
        taxNote: "Exempt for official use; taxable portion (personal use) added to gross",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Uniform exemption rule. Bills required. Employer-owned mobile = perquisite (nil value if use restricted for official).",
      },
      {
        id: "internet_reimb",
        name: "Internet / Broadband Reimbursement",
        base: "Actual bills",
        formula: "Actual broadband bills for official use",
        taxNote: "Exempt for official use with bills",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Became very common post-WFH (COVID). Employer to define policy on % official use.",
      },
      {
        id: "books_reimb",
        name: "Books & Periodicals Reimbursement",
        base: "Actual bills",
        formula: "Actual expenditure on books/journals relevant to employment",
        taxNote: "Fully exempt if for official/professional purposes; bills required",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Tax neutral across all states. Policy determines annual limit.",
      },
      {
        id: "lta_claim",
        name: "LTA Claim (Reimbursement)",
        base: "Actual transport fare",
        formula: "Actual airfare/rail fare; economy/AC1 only; domestic; family defined under Act",
        taxNote: "Exempt u/s 10(5) per block rules; 2 exemptions per 4-year block",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Current 4-year block: 2022–2025. Third journey in a block with encashment of LTA is allowed under certain conditions (LTC Cash Voucher Scheme).",
      },
      {
        id: "meal_voucher",
        name: "Meal Vouchers (Sodexo / Zeta)",
        base: "Per working day",
        formula: "₹50/meal × 2 meals × 22 working days = ₹2,200/month approx. (exempt limit)",
        taxNote: "Exempt if non-transferable, non-encashable meal vouchers; ₹50/meal limit",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "Common in IT and large companies. Amount > ₹50/meal is taxable as perquisite. Cash food allowance is fully taxable.",
      },
      {
        id: "medical_reimb",
        name: "Medical Reimbursement (on bills)",
        base: "Actual medical bills",
        formula: "Actual bills; up to company policy limit",
        taxNote: "Fully taxable post-2018 (merged with Standard Deduction); still common for employee welfare",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "While taxable, companies still reimburse as an employee benefit (not a tax saving now). Group mediclaim is separate and handled differently.",
      },
      {
        id: "relocation",
        name: "Relocation / Transfer Allowance",
        base: "Actual expenses",
        formula: "Actual reasonable relocation costs; some companies use grade-based fixed amounts",
        taxNote: "Exempt if for official transfer; taxable if moving to first job location",
        states: { MH:"O",KA:"O",WB:"O",TN:"O",GJ:"O",AP:"O",TG:"O",KL:"O",MP:"O",OD:"O",DL:"O",HR:"O",PB:"O",UP:"O",RJ:"O",HP:"O",JH:"O",CH:"O",AS:"O",GO:"O",MN:"O",MG:"O",TR:"O",SK:"O",MZ:"O" },
        notes: "No fixed statutory limit. Tax treatment depends on whether transfer is initiated by employer.",
      },
    ],
  },
  {
    id: "special_components",
    name: "Special & Exit Components",
    color: "#b45309",
    components: [
      {
        id: "gratuity_pay",
        name: "Gratuity Payment (on exit)",
        base: "Last Basic + DA",
        formula: "(Last Basic+DA) / 26 × 15 × Completed Years; max ₹20 lakh",
        taxNote: "Exempt u/s 10(10); up to ₹20 lakh for non-govt; fully exempt for govt",
        states: { MH:"M",KA:"M",WB:"M",TN:"M",GJ:"M",AP:"M",TG:"M",KL:"M",MP:"M",OD:"M",DL:"M",HR:"M",PB:"M",UP:"M",RJ:"M",HP:"M",JH:"M",CH:"M",AS:"M",GO:"M",MN:"M",MG:"M",TR:"M",SK:"M",MZ:"M" },
        notes: "Eligible if ≥5 years continuous service (death/disability: no minimum). Some states interpret '240 days = 1 year' differently. Karnataka: 240 days in any 12-month period.",
      },
      {
        id: "leave_enc",
        name: "Leave Encashment (during service)",
        base: "Basic + DA (typically)",
        formula: "Daily rate × EL days encashed; Daily rate = (Basic+DA)/26",
        taxNote: "Fully taxable during service; no exemption",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "Taxable during employment. At retirement: exempt up to ₹25 lakh u/s 10(10AA). State S&E Acts vary on max EL accumulation.",
      },
      {
        id: "notice_pay",
        name: "Notice Period Pay",
        base: "Gross monthly salary",
        formula: "Gross Salary × Notice Days / 30 (paid by employer or recovered from employee)",
        taxNote: "Taxable when received by employee; recovery from employee not deductible",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "State S&E Acts specify minimum notice requirements. Notice period and buyout terms in offer letter prevail for professional-grade staff.",
      },
      {
        id: "vrs",
        name: "VRS Compensation",
        base: "Last drawn salary × service",
        formula: "3 months' salary for each completed year of service, or salary × remaining service months; whichever is lower",
        taxNote: "Exempt u/s 10(10C) up to ₹5 lakh (if scheme complies with Rule 2BA)",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "Must be ≥40 years age or 10 years service. Scheme must be approved by Commissioner of Income Tax. Exempt only once in lifetime.",
      },
      {
        id: "esop",
        name: "ESOP / RSU Perquisite",
        base: "FMV at exercise/vesting - exercise price",
        formula: "Perquisite Value = (FMV on exercise date - Exercise Price) × Shares",
        taxNote: "Taxable as perquisite in the year of exercise/vesting; TDS required",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "SEBI-registered company: FMV as per stock exchange. Unlisted company: FMV as per merchant banker report. Startup deferral option: TDS at exercise or sale.",
      },
      {
        id: "arrears",
        name: "Salary Arrears",
        base: "Revised salary - Old salary",
        formula: "Diff per month × Number of months in arrear period",
        taxNote: "Taxable; claim relief u/s 89(1) via Form 10E for prior-year arrears",
        states: { MH:"C",KA:"C",WB:"C",TN:"C",GJ:"C",AP:"C",TG:"C",KL:"C",MP:"C",OD:"C",DL:"C",HR:"C",PB:"C",UP:"C",RJ:"C",HP:"C",JH:"C",CH:"C",AS:"C",GO:"C",MN:"C",MG:"C",TR:"C",SK:"C",MZ:"C" },
        notes: "Form 10E must be filed BEFORE filing ITR to claim relief. Relief is computed on 'spread-back' method.",
      },
    ],
  },
];

const PT_DETAILS = {
  MH: { rate: "₹175–₹300/m", freq: "Monthly", notes: "₹300 in Feb; nil ≤₹7,500" },
  KA: { rate: "₹200/m", freq: "Monthly", notes: "Nil ≤₹25,000; ₹200 above" },
  WB: { rate: "₹110–₹200/m", freq: "Monthly", notes: "Nil ≤₹10,000" },
  TN: { rate: "₹135–₹1,250/hyr", freq: "Half-yearly", notes: "Nil if annual salary ≤₹21,000" },
  GJ: { rate: "₹80–₹200/m", freq: "Monthly", notes: "Nil ≤₹5,999" },
  AP: { rate: "₹150–₹200/m", freq: "Monthly", notes: "Nil ≤₹15,000" },
  TG: { rate: "₹150–₹200/m", freq: "Monthly", notes: "Nil ≤₹15,000" },
  KL: { rate: "₹600–₹1,200/hyr", freq: "Half-yearly", notes: "Nil if annual salary <₹2L" },
  MP: { rate: "₹125–₹208/m", freq: "Monthly", notes: "Nil ≤₹18,750" },
  OD: { rate: "₹125–₹208/m", freq: "Monthly", notes: "Nil ≤₹13,304" },
  DL: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  HR: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  PB: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  UP: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  RJ: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  HP: { rate: "N/A", freq: "N/A", notes: "No Professional Tax" },
  JH: { rate: "₹100–₹150/m", freq: "Monthly", notes: "Nil ≤₹25,000" },
  CH: { rate: "₹150–₹200/m", freq: "Monthly", notes: "Nil ≤₹12,500" },
  AS: { rate: "₹150–₹208/m", freq: "Monthly", notes: "Nil ≤₹10,000" },
  GO: { rate: "₹150–₹200/m", freq: "Monthly", notes: "Nil ≤₹15,000" },
  MN: { rate: "₹50–₹208/m", freq: "Monthly", notes: "Multiple slabs" },
  MG: { rate: "₹16–₹208/m", freq: "Monthly", notes: "Nil ≤₹4,166" },
  TR: { rate: "₹150–₹200/m", freq: "Monthly", notes: "Nil ≤₹7,500" },
  SK: { rate: "Nominal", freq: "Monthly", notes: "Limited categories" },
  MZ: { rate: "₹50–₹208/m", freq: "Monthly", notes: "Multiple slabs" },
};

const LWF_DETAILS = {
  MH: { emp: "₹6–₹48", er: "₹12–₹96", freq: "Semi-annual (Jun & Dec)" },
  KA: { emp: "₹20/yr", er: "₹40/yr", freq: "Annual (January)" },
  WB: { emp: "₹3/m", er: "₹6/m", freq: "Monthly" },
  TN: { emp: "₹20/yr", er: "₹40/yr", freq: "Annual (April)" },
  GJ: { emp: "₹6/m", er: "₹12/m", freq: "Monthly" },
  AP: { emp: "₹30/yr", er: "₹70/yr", freq: "Annual" },
  TG: { emp: "₹30/yr", er: "₹70/yr", freq: "Annual" },
  KL: { emp: "₹20/m", er: "₹20/m", freq: "Monthly" },
  MP: { emp: "₹10/yr", er: "₹30/yr", freq: "Annual" },
  OD: { emp: "₹3/m", er: "₹6/m", freq: "Monthly" },
  DL: { emp: "₹0.75/m", er: "₹2.25/m", freq: "Monthly" },
  HR: { emp: "₹0.50/m", er: "₹2/m", freq: "Monthly" },
  PB: { emp: "₹7–₹14", er: "₹14–₹28", freq: "Monthly (slab)" },
  UP: { emp: "N/A", er: "N/A", freq: "No LWF" },
  RJ: { emp: "N/A", er: "N/A", freq: "No LWF" },
  HP: { emp: "N/A", er: "N/A", freq: "No LWF" },
  JH: { emp: "₹5/m", er: "₹15/m", freq: "Monthly" },
  CH: { emp: "₹10/yr", er: "₹30/yr", freq: "Annual" },
  AS: { emp: "₹20/hyr", er: "₹40/hyr", freq: "Semi-annual" },
  GO: { emp: "₹15/m", er: "₹45/m", freq: "Monthly" },
  MN: { emp: "N/A", er: "N/A", freq: "No LWF" },
  MG: { emp: "N/A", er: "N/A", freq: "No LWF" },
  TR: { emp: "N/A", er: "N/A", freq: "No LWF" },
  SK: { emp: "N/A", er: "N/A", freq: "No LWF" },
  MZ: { emp: "N/A", er: "N/A", freq: "No LWF" },
};

export default function PayrollMatrix() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredComponents = useMemo(() => {
    let comps = [];
    CATEGORIES.forEach((cat) => {
      if (selectedCategory === "all" || selectedCategory === cat.id) {
        cat.components.forEach((c) => {
          comps.push({ ...c, categoryName: cat.name, categoryColor: cat.color, categoryId: cat.id });
        });
      }
    });
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      comps = comps.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.taxNote.toLowerCase().includes(q)
      );
    }
    return comps;
  }, [selectedCategory, searchTerm]);

  const visibleStates = selectedState
    ? STATES.filter((s) => s.code === selectedState)
    : STATES;

  const getStatusCell = (statusCode) => {
    const s = STATUS[statusCode] || STATUS["N"];
    return (
      <div
        style={{
          background: s.bg,
          color: s.color,
          borderRadius: 4,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          margin: "auto",
          border: `1px solid ${s.color}40`,
        }}
        title={s.label}
      >
        {s.symbol}
      </div>
    );
  };

  const countByStatus = (comp) => {
    const counts = { M: 0, V: 0, O: 0, N: 0, C: 0 };
    Object.values(comp.states).forEach((s) => { if (counts[s] !== undefined) counts[s]++; });
    return counts;
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)", color: "white", padding: "24px 32px" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, opacity: 0.7, marginBottom: 6 }}>HRMS — India Payroll Module</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Payroll Component Traceability Matrix</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.75, fontSize: 13 }}>
          State-wise applicability of all payroll components • FY 2024–25 • 25 States & UTs
        </p>
      </div>

      {/* Legend */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "12px 32px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>LEGEND:</span>
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 22, height: 22, background: v.bg, border: `1px solid ${v.color}40`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: v.color, fontSize: 11 }}>{v.symbol}</div>
            <span style={{ color: "#475569" }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", gap: 0 }}>
        {[
          { id: "matrix", label: "📊 Full Matrix" },
          { id: "pt", label: "🏛️ Professional Tax" },
          { id: "lwf", label: "⚖️ Labour Welfare Fund" },
          { id: "detail", label: "📋 Component Detail" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "14px 20px",
              border: "none",
              background: "transparent",
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? "#1e40af" : "#64748b",
              borderBottom: activeTab === tab.id ? "3px solid #1e40af" : "3px solid transparent",
              cursor: "pointer",
              fontSize: 13,
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>

        {/* FULL MATRIX TAB */}
        {activeTab === "matrix" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <input
                placeholder="🔍 Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 240, outline: "none" }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={selectedState || ""}
                onChange={(e) => setSelectedState(e.target.value || null)}
                style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "white", outline: "none" }}
              >
                <option value="">All States</option>
                {STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
                {filteredComponents.length} components × {visibleStates.length} states
              </span>
            </div>

            {/* Matrix Table */}
            <div style={{ overflowX: "auto", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e2e8f0", position: "sticky", left: 0, background: "#f8fafc", minWidth: 220, zIndex: 10 }}>
                      Component
                    </th>
                    <th style={{ padding: "12px 8px", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e2e8f0", minWidth: 80, whiteSpace: "nowrap" }}>
                      Formula Base
                    </th>
                    {visibleStates.map((s) => (
                      <th key={s.code} style={{ padding: "10px 4px", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e2e8f0", minWidth: 44, textAlign: "center" }}>
                        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10, fontWeight: 700, color: "#1e40af" }}>{s.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => {
                    const catComps = filteredComponents.filter((c) => c.categoryId === cat.id);
                    if (catComps.length === 0) return null;
                    return [
                      <tr key={`cat-${cat.id}`}>
                        <td colSpan={visibleStates.length + 2} style={{ background: cat.color + "18", padding: "8px 16px", fontWeight: 700, fontSize: 11, color: cat.color, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${cat.color}30` }}>
                          {cat.name}
                        </td>
                      </tr>,
                      ...catComps.map((comp, i) => (
                        <tr
                          key={comp.id}
                          style={{ background: i % 2 === 0 ? "white" : "#f8fafc", cursor: "pointer" }}
                          onClick={() => { setSelectedComponent(comp); setActiveTab("detail"); }}
                        >
                          <td style={{ padding: "10px 16px", fontWeight: 500, color: "#0f172a", borderBottom: "1px solid #f1f5f9", position: "sticky", left: 0, background: i % 2 === 0 ? "white" : "#f8fafc", zIndex: 5 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{comp.name}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{comp.categoryName}</div>
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: 11, color: "#64748b", borderBottom: "1px solid #f1f5f9", maxWidth: 120 }}>
                            {comp.base}
                          </td>
                          {visibleStates.map((s) => (
                            <td key={s.code} style={{ padding: "10px 4px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                              {getStatusCell(comp.states[s.code] || "N")}
                            </td>
                          ))}
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
              Click any row to view full component details →
            </div>
          </div>
        )}

        {/* PT TAB */}
        {activeTab === "pt" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Professional Tax — State-wise Slabs</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Governed by state Professional Tax Acts. Max ₹2,500/year. Deductible u/s 16(iii) of Income Tax Act.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {STATES.map((st) => {
                const pt = PT_DETAILS[st.code];
                const hasPT = pt && pt.rate !== "N/A";
                return (
                  <div key={st.code} style={{ background: "white", border: hasPT ? "1px solid #bfdbfe" : "1px solid #e2e8f0", borderRadius: 10, padding: 16, borderLeft: `4px solid ${hasPT ? "#1e40af" : "#e2e8f0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{st.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{st.code}</div>
                      </div>
                      <div style={{ background: hasPT ? "#dbeafe" : "#f1f5f9", color: hasPT ? "#1e40af" : "#9ca3af", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {hasPT ? "PT Applicable" : "No PT"}
                      </div>
                    </div>
                    {hasPT ? (
                      <>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ background: "#f0f9ff", borderRadius: 6, padding: "6px 12px", flex: 1 }}>
                            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Rate</div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#0369a1" }}>{pt.rate}</div>
                          </div>
                          <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "6px 12px", flex: 1 }}>
                            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Frequency</div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#16a34a" }}>{pt.freq}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 6, fontSize: 12, color: "#475569" }}>
                          📌 {pt.notes}
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 6, fontSize: 12, color: "#9ca3af" }}>
                        No Professional Tax legislation in this state.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LWF TAB */}
        {activeTab === "lwf" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Labour Welfare Fund — State-wise Details</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Governed by state LWF Acts. Nominal amounts; mandatory where applicable. Both employee and employer contribute.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {STATES.map((st) => {
                const lwf = LWF_DETAILS[st.code];
                const hasLWF = lwf && lwf.emp !== "N/A";
                return (
                  <div key={st.code} style={{ background: "white", border: hasLWF ? "1px solid #d1fae5" : "1px solid #e2e8f0", borderRadius: 10, padding: 16, borderLeft: `4px solid ${hasLWF ? "#059669" : "#e2e8f0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{st.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{st.code}</div>
                      </div>
                      <div style={{ background: hasLWF ? "#d1fae5" : "#f1f5f9", color: hasLWF ? "#059669" : "#9ca3af", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {hasLWF ? "LWF Applicable" : "No LWF"}
                      </div>
                    </div>
                    {hasLWF ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Employee</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#059669" }}>{lwf.emp}</div>
                        </div>
                        <div style={{ background: "#faf5ff", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Employer</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#7c3aed" }}>{lwf.er}</div>
                        </div>
                        <div style={{ background: "#fff7ed", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>Frequency</div>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#d97706" }}>{lwf.freq}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 6, fontSize: 12, color: "#9ca3af" }}>
                        No Labour Welfare Fund Act applicable in this state.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAIL TAB */}
        {activeTab === "detail" && (
          <div>
            {!selectedComponent ? (
              <div>
                <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Component Detail View</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Select a component from the matrix or click below to view full details.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {CATEGORIES.map((cat) =>
                    cat.components.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedComponent({ ...comp, categoryName: cat.name, categoryColor: cat.color })}
                        style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, cursor: "pointer", borderLeft: `4px solid ${cat.color}`, transition: "box-shadow 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>{comp.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{comp.taxNote}</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(() => {
                            const counts = countByStatus(comp);
                            return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => (
                              <span key={k} style={{ background: STATUS[k].bg, color: STATUS[k].color, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600 }}>
                                {STATUS[k].symbol} {v}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", marginBottom: 20, fontWeight: 600, color: "#374151" }}
                >
                  ← Back to All Components
                </button>
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ background: `linear-gradient(135deg, ${selectedComponent.categoryColor}22, ${selectedComponent.categoryColor}10)`, borderBottom: `3px solid ${selectedComponent.categoryColor}`, padding: 24 }}>
                    <div style={{ fontSize: 11, color: selectedComponent.categoryColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{selectedComponent.categoryName}</div>
                    <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{selectedComponent.name}</h2>
                    <div style={{ fontSize: 13, color: "#475569" }}>{selectedComponent.notes}</div>
                  </div>
                  <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📐 Formula / Base</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>{selectedComponent.base}</div>
                      <div style={{ fontSize: 12, color: "#475569", fontFamily: "monospace", background: "#e2e8f0", borderRadius: 6, padding: "8px 12px", marginTop: 8 }}>{selectedComponent.formula}</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>💡 Tax Treatment</div>
                      <div style={{ fontSize: 13, color: "#0f172a" }}>{selectedComponent.taxNote}</div>
                    </div>
                  </div>
                  <div style={{ padding: "0 24px 24px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>State-wise Applicability</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      {STATES.map((st) => {
                        const statusCode = selectedComponent.states[st.code] || "N";
                        const s = STATUS[statusCode];
                        return (
                          <div key={st.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: s.bg + "80", border: `1px solid ${s.color}30`, borderRadius: 8 }}>
                            <div style={{ width: 24, height: 24, background: s.bg, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{s.symbol}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{st.name}</div>
                              <div style={{ fontSize: 10, color: s.color }}>{s.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
