#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('============================================');
console.log('PMS Firebase Deployment Tool');
console.log('============================================');
console.log('');
console.log('What would you like to deploy?');
console.log('1. Functions only');
console.log('2. Hosting only');
console.log('3. Full deployment (Functions, Hosting, Firestore, Storage)');
console.log('4. Cancel');

rl.question('\nEnter your choice (1-4): ', (choice) => {
  let command = 'firebase';
  let args = ['deploy'];
  
  switch(choice) {
    case '1':
      console.log('\nDeploying Firebase Functions...');
      args.push('--only', 'functions');
      break;
    case '2':
      console.log('\nDeploying Firebase Hosting...');
      args.push('--only', 'hosting');
      break;
    case '3':
      console.log('\nPerforming full deployment...');
      // No additional args needed for full deployment
      break;
    case '4':
      console.log('\nDeployment cancelled.');
      rl.close();
      return;
    default:
      console.log('\nInvalid choice. Deployment cancelled.');
      rl.close();
      return;
  }
  
  // Prepare environment for deployment
  console.log('\n1. Building React application...');
  
  const buildProcess = spawn('npm', ['run', 'build'], { 
    cwd: './pms-app',
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('\nBuild process failed with code', code);
      rl.close();
      return;
    }
    
    console.log('\n2. Starting Firebase deployment...');
    
    const deployProcess = spawn(command, args, { 
      stdio: 'inherit',
      shell: true
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\nDeployment completed successfully!');
      } else {
        console.error('\nDeployment failed with code', code);
      }
      rl.close();
    });
  });
});

rl.on('close', () => {
  process.exit(0);
}); 