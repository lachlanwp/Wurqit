const { getDesktopPath } = require('../generator');
const os = require('os');
const path = require('path');

function testCrossPlatformCompatibility() {
    console.log('Testing cross-platform desktop path compatibility...\n');
    
    const platform = os.platform();
    const homeDir = os.homedir();
    
    console.log(`Current Platform: ${platform}`);
    console.log(`Home Directory: ${homeDir}`);
    console.log(`Architecture: ${os.arch()}`);
    console.log();
    
    // Test current platform
    try {
        const desktopPath = getDesktopPath();
        console.log(`✅ Current platform (${platform}) desktop path: ${desktopPath}`);
    } catch (error) {
        console.error(`❌ Error on current platform: ${error.message}`);
    }
    
    console.log('\n--- Cross-Platform Path Examples ---');
    
    // Simulate different platforms
    const testPlatforms = [
        { name: 'Windows', platform: 'win32', homeDir: 'C:\\Users\\TestUser' },
        { name: 'macOS', platform: 'darwin', homeDir: '/Users/testuser' },
        { name: 'Linux', platform: 'linux', homeDir: '/home/testuser' }
    ];
    
    testPlatforms.forEach(test => {
        console.log(`\n${test.name} (${test.platform}):`);
        console.log(`  Home: ${test.homeDir}`);
        
        let expectedPath;
        switch (test.platform) {
            case 'win32':
                expectedPath = path.join(test.homeDir, 'Desktop');
                break;
            case 'darwin':
                expectedPath = path.join(test.homeDir, 'Desktop');
                break;
            case 'linux':
                expectedPath = path.join(test.homeDir, 'Desktop');
                break;
        }
        
        console.log(`  Expected Desktop: ${expectedPath}`);
        
        // Test Linux variations
        if (test.platform === 'linux') {
            const variations = [
                'Desktop',
                'Рабочий стол', // Russian
                'Escritorio',   // Spanish
                'Bureau',       // French
                'Schreibtisch'  // German
            ];
            
            variations.forEach(variation => {
                const variationPath = path.join(test.homeDir, variation);
                console.log(`    ${variation}: ${variationPath}`);
            });
        }
    });
    
    console.log('\n--- Path Separator Tests ---');
    console.log(`Windows path separator: ${path.win32.sep}`);
    console.log(`POSIX path separator: ${path.posix.sep}`);
    console.log(`Current platform separator: ${path.sep}`);
    
    console.log('\n--- Example File Paths ---');
    const timestamp = '2025-07-26T06-30-00-000Z';
    const filename = `workout_video_${timestamp}.mp4`;
    
    testPlatforms.forEach(test => {
        const desktopPath = path.join(test.homeDir, 'Desktop');
        const fullPath = path.join(desktopPath, filename);
        console.log(`${test.name}: ${fullPath}`);
    });
    
    console.log('\n✅ Cross-platform compatibility test completed!');
}

testCrossPlatformCompatibility(); 