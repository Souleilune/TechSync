const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables missing - using mock client');
  // Export a mock client for now
  module.exports = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: 'No Supabase config' })
        })
      })
    })
  };
} else {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  module.exports = supabase;
}