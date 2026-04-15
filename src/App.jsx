import PayrollMatrix from './components/PayrollMatrix';
import ErrorBoundary from './components/common/ErrorBoundary';
import { supabase } from './data/supabaseClient';

export default function App() {
  const isSupabaseMissing = !supabase;

  return (
    <ErrorBoundary>
      {isSupabaseMissing && (
        <div style={{
          backgroundColor: '#fffbeb',
          color: '#92400e',
          padding: '10px 20px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '600',
          borderBottom: '1px solid #fde68a',
          position: 'sticky',
          top: 0,
          zIndex: 9999
        }}>
          ⚠️ Backend configuration (Supabase) is missing. If you just added the .env file, please <strong>restart your development server</strong> (Ctrl+C and npm run dev).
        </div>
      )}
      <PayrollMatrix />
    </ErrorBoundary>
  );
}
