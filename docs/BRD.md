# Business Requirements Document (BRD)
**Project Name:** Indian Payroll Management System
**Document Version:** 1.0

---

## 1. Executive Summary
The Indian Payroll Management System aims to automate the end-to-end payroll processing lifecycle for Indian organizations. The platform ensures 100% compliance with dynamic state-specific and federal taxation laws, including EPF, ESI, Professional Tax (PT), Labour Welfare Fund (LWF), and the dual tax regimes (Old vs. New). 

The goal of this project is to create a robust, error-free SaaS application that empowers:
1. **HR / Payroll Administrators** to orchestrate monthly payruns effortlessly.
2. **Finance Teams** to seamlessly verify IT declarations and reimbursement claims.
3. **Employees** to maintain self-service portals, preview live tax computations, and access their payslips securely.

---

## 2. Project Scope
### 2.1 In-Scope Capabilities
- **Dynamic Salary Structuring:** Support for fixed, variable, reimbursement, and statutory deductions customized per employee.
- **Statutory Compliance Engine:** Auto-deduction limits for EPF (12% of Basic up to ₹1,800 or actual), ESI (1.75% for salary <= ₹21,000 max), LWF (state-wise arrays), and PT (state-wise slabs).
- **Taxation Support:** Automatic calculation of TDS based on age, tax regime, and verified 80C/80D declarations.
- **Attendance & Proration:** Support for Loss of Pay (LOP), arrear injections, and overtime (OT) bonuses integrated directly into the pay cycle.
- **Workflow Approvals:** A Finance Verification Dashboard to lock, reject, or cap employee tax-saving claims algorithmically to legally permissible limits.
- **Bulk Integration:** Generation of banking NEFT/RTGS payloads and government statutory lodgement files (.ECR, .CSV).

### 2.2 Out of Scope
- Direct banking API integrations (e.g. initiating transfers directly without a bank file).
- Attendance monitoring device integrations (biometric punch clocks). Attendance is uploaded as pre-processed LOP inputs.

---

## 3. Business Drivers & Objectives
1. **Reduce Manual Intervention:** Automate iterative MS Excel payroll workflows to save 40+ hours per pay cycle.
2. **Eliminate Compliance Attrition:** Automate state-specific configurations (e.g., PT differing in KA vs. MH) so local laws are never violated.
3. **Enhance Transparency:** Allow employees to transparently simulate their tax liability and interactively choose their optimal tax regime directly within their portal without requiring HR assistance.

---

## 4. Key Stakeholders
| Stakeholder | Role / Interaction |
| :--- | :--- |
| **System Administrator** | Modifies core settings, edits the generic stat matrices, triggers global operations. |
| **HR Payroll Officer** | Initiates the monthly payrun, applies LOPs, verifies gross numbers, generates slips. |
| **Finance Manager** | Logs into the Verification Dashboard to approve 80C/80D proofs and limits. Confirms the final payrun matrix. |
| **Employees** | Submits IT declarations, tracks claims in their Portal, and downloads Form 16s / Payslips. |

---

## 5. Non-Functional Requirements
- **Performance:** Complex batch processing of 5,000+ employees must evaluate tax and net pay in under 5 minutes without memory exhaustion.
- **Security:** End-to-end encryption of all proofs uploaded. Role-Level Security (RLS) policies within Supabase restricting unprivileged access to salary data.
- **Availability:** Ensure 99.9% uptime, utilizing cloud-hosted edge features.

---

## 6. Assumptions & Dependencies
- It is assumed that the primary tax laws for the Financial Year exist as constants and HR admins will adjust them if government slabs change mid-year via the `Category` configurations.
- Assumes Supabase operates as the un-metered active transactional database.
