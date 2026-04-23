-- Create Employee Submissions table for IT Declarations & Reimbursements
CREATE TABLE IF NOT EXISTS employee_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    financial_year TEXT NOT NULL, -- e.g. "2026-27"
    type TEXT NOT NULL, -- 'it_declaration' or 'reimbursement'
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'verified', 'rejected'
    submitted_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- The numbers and proof URLs submitted by the employee
    verified_data JSONB, -- The exact numbers finance approved, which feeds into payruns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS & Add Policy
ALTER TABLE employee_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON employee_submissions FOR ALL USING (true);

-- Add Location columns to employees
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS work_state TEXT,
  ADD COLUMN IF NOT EXISTS work_city TEXT,
  ADD COLUMN IF NOT EXISTS base_state TEXT,
  ADD COLUMN IF NOT EXISTS base_city TEXT;

-- Add Exit Lifecycle columns to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS exit_date DATE,
  ADD COLUMN IF NOT EXISTS exit_reason TEXT;
