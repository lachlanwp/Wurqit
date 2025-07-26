const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get all test files in the current directory
const testFiles = fs.readdirSync(__dirname)
    .filter(file => file.startsWith('test-') && file.endsWith('.js'))
    .filter(file => file !== 'run-all-tests.js');

console.log('🧪 Running all tests...\n');
console.log(`Found ${testFiles.length} test files:\n`);

let passedTests = 0;
let failedTests = 0;

async function runTest(testFile) {
    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Running: ${testFile}`);
        console.log(`${'='.repeat(60)}`);
        
        const testProcess = spawn('node', [testFile], {
            cwd: __dirname,
            stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        testProcess.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });
        
        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            process.stderr.write(data);
        });
        
        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`\n✅ ${testFile} - PASSED`);
                passedTests++;
            } else {
                console.log(`\n❌ ${testFile} - FAILED (exit code: ${code})`);
                failedTests++;
            }
            resolve();
        });
        
        testProcess.on('error', (error) => {
            console.log(`\n❌ ${testFile} - ERROR: ${error.message}`);
            failedTests++;
            resolve();
        });
    });
}

async function runAllTests() {
    for (const testFile of testFiles) {
        await runTest(testFile);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total tests: ${testFiles.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    
    if (failedTests === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    }
}

runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
}); 