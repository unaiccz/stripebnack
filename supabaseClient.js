import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('ERROR: SUPABASE_URL is missing!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('SUPABASE_URL is required. Please set it in environment variables.');
}

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_ANON_KEY is missing!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  throw new Error('SUPABASE_ANON_KEY is required. Please set it in environment variables.');
}

console.log('✅ Supabase client initialized successfully');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
