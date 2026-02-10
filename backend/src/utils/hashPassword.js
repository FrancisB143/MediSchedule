import bcrypt from 'bcrypt';

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: node hashPassword.js <password>');
  process.exit(1);
}

// Hash the password
const saltRounds = 10;
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('\nPassword hashed successfully!');
  console.log('\nOriginal password:', password);
  console.log('\nBcrypt hash:');
  console.log(hash);
  console.log('\nUse this hash in your SQL INSERT statement:');
  console.log(`INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)`);
  console.log(`VALUES ('email@example.com', '${hash}', 'FirstName', 'LastName', 'Specialty');`);
});
