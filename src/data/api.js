import { supabase } from './supabaseClient';

/**
 * API layer for Supabase interactions
 */

// --- Company Settings ---
export async function getCompanySettings() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('company_settings')
    .select('settings')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data?.settings || null;
}

export async function saveCompanySettings(settings) {
  if (!supabase) throw new Error('Supabase client not initialized');
  // Try to get existing first
  const { data: existing } = await supabase
    .from('company_settings')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('company_settings')
      .update({ settings, updated_at: new Date() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('company_settings')
      .insert({ settings });
    if (error) throw error;
  }
}

// --- Employees ---
export async function getEmployees() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function upsertEmployee(employee) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { id, created_at, updated_at, ...payload } = employee;
  
  if (id) {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...payload, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteEmployee(id) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Payruns ---
export async function getPayruns() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('payruns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPayrun(monthYear) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('payruns')
    .insert({ month_year: monthYear, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayrunStatus(id, status) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('payruns')
    .update({ status, updated_at: new Date() })
    .eq('id', id);
  if (error) throw error;
}

// --- Payrun Adjustments ---
export async function getPayrunAdjustments(payrunId) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('payrun_adjustments')
    .select('*')
    .eq('payrun_id', payrunId);
  if (error) throw error;
  return data;
}

export async function savePayrunAdjustment(payrunId, employeeId, adjustments, computedData) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('payrun_adjustments')
    .upsert({ 
      payrun_id: payrunId, 
      employee_id: employeeId, 
      adjustments, 
      computed_data: computedData,
      updated_at: new Date() 
    }, { onConflict: 'payrun_id, employee_id' });
  if (error) throw error;
}

// --- Historical Data ---

/**
 * Fetches all previous TDS deductions for an employee in a given FY
 */
export async function getEmployeeFYTaxHistory(employeeId, monthLabel) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // 1. Get all published/completed payruns
  const { data: payruns, error: pError } = await supabase
    .from('payruns')
    .select('id, month_year')
    .in('status', ['published', 'completed']);
  
  if (pError) throw pError;
  if (!payruns || payruns.length === 0) return 0;

  // 2. Identify current FY start (April)
  const [monthName, yearStr] = monthLabel.split(' ');
  const monthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(monthName);
  const currentDate = new Date(parseInt(yearStr), monthIdx, 1);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  let fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const fyStartDate = new Date(fyStartYear, 3, 1); // April 1st

  // 3. Filter payruns belonging to the current FY but BEFORE the current month
  const fyPayrunIds = payruns.filter(p => {
    const [pMonthName, pYearStr] = p.month_year.split(' ');
    const pMonthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(pMonthName);
    const pDate = new Date(parseInt(pYearStr), pMonthIdx, 1);
    return pDate >= fyStartDate && pDate < currentDate;
  }).map(p => p.id);

  if (fyPayrunIds.length === 0) return 0;

  // 4. Fetch adjustments for these payruns
  const { data: adjs, error: aError } = await supabase
    .from('payrun_adjustments')
    .select('computed_data')
    .eq('employee_id', employeeId)
    .in('payrun_id', fyPayrunIds);

  if (aError) throw aError;
  
  // 5. Aggregate TDS from computed_data
  const totalTDS = (adjs || []).reduce((sum, item) => {
    return sum + (item.computed_data?.tds || 0);
  }, 0);

  return totalTDS;
}
