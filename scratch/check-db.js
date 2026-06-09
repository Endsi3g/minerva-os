const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kcwdmufkyjsitsuxmqld.supabase.co';
const supabaseKey = 'sb_publishable_fJZzWMwE5Sl1zkr9h7fiLQ_6-OOCDIB';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking portal_tokens...');
  
  const { data: tokens, error: tokenError } = await supabase
    .from('portal_tokens')
    .select('*')
    .limit(1);
    
  console.log('portal_tokens query:', { tokens, tokenError });
}

check();
