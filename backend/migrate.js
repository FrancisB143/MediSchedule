import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    const sql = `ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id), ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Available';`;
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('Migration completed successfully');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();