#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing all Metro and Expo caches...');

try {
  // Clear Metro cache
  console.log('📱 Clearing Metro cache...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Metro cache clear failed, continuing...');
}

try {
  // Clear node_modules cache
  console.log('📦 Clearing node_modules cache...');
  const nodeModulesPath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('✅ node_modules cache cleared');
  }
} catch (error) {
  console.log('⚠️  node_modules cache clear failed:', error.message);
}

try {
  // Clear .expo cache
  console.log('🔧 Clearing .expo cache...');
  const expoCachePath = path.join(__dirname, '.expo');
  if (fs.existsSync(expoCachePath)) {
    fs.rmSync(expoCachePath, { recursive: true, force: true });
    console.log('✅ .expo cache cleared');
  }
} catch (error) {
  console.log('⚠️  .expo cache clear failed:', error.message);
}

console.log('✨ Cache clearing complete! Try running "npm start" now.');