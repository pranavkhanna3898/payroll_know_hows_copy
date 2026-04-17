# User Manual
**Project Name:** Indian Payroll Management System

Welcome to the Employee & Administrator User Manual. This guide provides step-by-step instructions for interacting with the main views of the application.

---

## Part 1: For Employees (Employee Portal)

### 1.1 Accessing the Portal
1. Navigate to the **Employee Portal** via the main navigation tab.
2. Select your specific profile from the "View as Employee" dropdown (simulating a login for sandbox purposes).
3. Ensure you are viewing the correct Financial Year, dynamically extracted at the top of the interface.

### 1.2 Submitting IT Declarations
1. Open the **IT Declarations** tab.
2. If the active window is disabled by your HR team, the form will be locked out and display a prompt. Wait for the window to be opened.
3. Fill in your anticipated tax savings in the text boxes:
   - Example: Enter ₹1,50,000 inside the `80C` input field.
   - Example: Check the "Senior Citizen" box if claiming max limits for your parents' medical premiums.
4. **Attach Proofs:** Click securely on `Upload File` sequentially next to every inputted amount to bind your scanned receipts.
5. Hit **Submit Declarations**. Your input goes into the `Pending` queue.

### 1.3 Requesting Reimbursements
1. Open the **Reimbursement Claims** tab.
2. *Note:* You will ONLY see text boxes for components that strictly exist inside your designated compensation structure. 
3. Fill out the "Claim Amount" text box. If it exceeds your pre-allocated monthly limit, a red alert pops up warning you.
4. Upload specific itemized bills using the file picker.
5. Click **Submit Claims for Verification**.

---

## Part 2: For Finance / Approvers (Finance Verification)

### 2.1 Locating Pending Claims
1. Navigate to the **Finance Verification Dashboard**.
2. Expand the `Pending Approvals` array located dynamically on the left list view.
3. Click any pending employee; their historical payload maps itself onto the primary deep-dive view on the right.

### 2.2 Verifying Values
1. Contrast the Employee's **Declared Amount** against their attached **Proof URL**.
2. Type in the **Verified Allowable** amount computationally authorized by you. 
   - *Example:* If an employee declares ₹1,60,000 for 80C, your input box automatically restricts down to ₹1,50,000 via native auto-capping logic.
3. Press **Approve & Verify Data** or heavily reject it using **Reject Submission**.
*Approval seals the row permanently into `verified_data`, triggering downstream payload extraction for the HR Admin's payroll tax calculations.*

---

## Part 3: For HR Admins (Payroll Operations)

### 3.1 Establishing Matrix Constants
1. Head to the **Payroll Matrix** module initially.
2. Confirm that states like Maharashtra operate under your assumed PT flags, and check if ESI threshold caps (₹21,000) match the gazette targets. 

### 3.2 Executing a Monthly Payrun
**Step 1: Initiate**
- Go to **Payroll Operations** > **New Payrun**.
- Select "April 2026", bulk-filter specific engineering departments, and highlight all members physically required for the target batch. Click **Initiate**.

**Step 2: Review (LOP & Overtime)**
- Input LOP figures individually per row. 
- *A preview gross logic renders at the top to track variances.* 

**Step 3: Tax Check**
- Simply view and scroll. Check for red flags. If a "Warning: Zero IT Declared" tag appears on an Old Regime constituent, immediately nudge them.
- Click **Proceed to Confirmation**.

**Step 4: Confirm**
- Visually reconcile the ultimate sum of Net Payouts across the batch. 
- Type "CONFIRM" if asked mathematically, locking the payrun natively against edits.

**Step 5: Output Procurement**
- Navigate through tabs on the confirmed success screen to export.
- Click **Payslips** to instantly build browser-viewable PDF documents.
- Click **Bank File** to extract the NEFT text file, and instantly push to your banking gateway.
