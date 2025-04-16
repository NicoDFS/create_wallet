import TronWalletGenerator from './tronWalletGenerator';

// Test valid Tron address format
const validTronAddress = 'TRjE1H8dxypKM1NZRdysbs9wo7huR4bdNz';
console.log(`Valid Tron address check: ${TronWalletGenerator.validateTronAddress(validTronAddress)}`);

// Test invalid Tron address format
const invalidTronAddress = 'AB123';
console.log(`Invalid Tron address check: ${TronWalletGenerator.validateTronAddress(invalidTronAddress)}`);

// Test wallet generation and decryption
console.log('\nGenerating a new encrypted wallet...');
const password = 'TestPassword123!';
const encryptedWallet = TronWalletGenerator.generateEncryptedWallet(password);

console.log(`Generated Tron address: ${encryptedWallet.address}`);
console.log(`Is address valid: ${TronWalletGenerator.validateTronAddress(encryptedWallet.address)}`);

console.log('\nDecrypting wallet...');
try {
  const decryptedWallet = TronWalletGenerator.decryptWallet(encryptedWallet, password);
  console.log('Decryption successful!');
  console.log(`Recovered Tron Address: ${decryptedWallet.address}`);
} catch (error) {
  console.error('Decryption failed:', error);
}

// Test with wrong password
console.log('\nTesting with wrong password...');
try {
  const decryptedWallet = TronWalletGenerator.decryptWallet(encryptedWallet, 'WrongPassword');
  console.log('Decryption should have failed but succeeded!');
} catch (error) {
  console.log('Decryption correctly failed with wrong password');
}

// Test with invalid address
console.log('\nTesting with invalid address format...');
try {
  const invalidWallet = {
    ...encryptedWallet,
    address: 'InvalidTronAddress'
  };
  const decryptedWallet = TronWalletGenerator.decryptWallet(invalidWallet, password);
  console.log('Validation should have failed but succeeded!');
} catch (error) {
  console.log('Address validation correctly failed with invalid format');
} 