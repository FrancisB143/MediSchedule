import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function testAuth() {
  const email = 'fbangoy_230000001354@uic.edu.ph';
  const password = '12345';

  console.log('\n🔍 Testing Supabase Connection & Authentication\n');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('---\n');

  // Check admins table
  console.log('Querying admins table...');
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();

  if (adminError) {
    console.log('❌ Admin Error:', adminError.message);
    console.log('Error details:', adminError);
  }

  if (admin) {
    console.log('✅ Admin found!');
    console.log('- ID:', admin.id);
    console.log('- Email:', admin.email);
    console.log('- Name:', admin.first_name, admin.last_name);
    console.log('- Password Hash (first 30 chars):', admin.password_hash?.substring(0, 30) + '...');
    console.log('- Hash length:', admin.password_hash?.length);
    
    // Test bcrypt comparison
    console.log('\n🔐 Testing password verification...');
    try {
      const isValid = await bcrypt.compare(password, admin.password_hash);
      console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');
      
      if (!isValid) {
        console.log('\n⚠️  Password hash does not match!');
        console.log('This means the password_hash in the database is NOT the bcrypt hash of "12345"');
        console.log('\nExpected hash for "12345":');
        const correctHash = await bcrypt.hash(password, 10);
        console.log(correctHash);
        console.log('\nYour current hash:');
        console.log(admin.password_hash);
      }
    } catch (err) {
      console.log('❌ Bcrypt error:', err.message);
    }
  } else {
    console.log('❌ No admin found with this email');
    
    // Check all admins
    console.log('\n📋 All admins in database:');
    const { data: allAdmins } = await supabase
      .from('admins')
      .select('email, first_name, last_name');
    
    if (allAdmins && allAdmins.length > 0) {
      allAdmins.forEach(a => console.log(`  - ${a.email} (${a.first_name} ${a.last_name})`));
    } else {
      console.log('  No admins found in database!');
    }
  }

  // Check doctors table too
  console.log('\n---\nQuerying doctors table...');
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', 'abucio_230000001128@uic.edu.ph')
    .single();

  if (doctorError) {
    console.log('❌ Doctor Error:', doctorError.message);
  }

  if (doctor) {
    console.log('✅ Doctor found!');
    console.log('- Email:', doctor.email);
    console.log('- Name:', doctor.first_name, doctor.last_name);
    console.log('- Password Hash (first 30 chars):', doctor.password_hash?.substring(0, 30) + '...');
  } else {
    console.log('❌ No doctor found');
  }

  process.exit(0);
}

testAuth().catch(console.error);
