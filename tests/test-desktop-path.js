const { getDesktopPath } = require('../generator');
const os = require('os');
const fs = require('fs');
const path = require('path');

function testDesktopPath() {
    console.log('Testing desktop path functionality...\n');
    
    console.log(`Operating System: ${os.platform()}`);
    console.log(`Home Directory: ${os.homedir()}`);
    console.log(`Architecture: ${os.arch()}`);
    console.log();
    
    try {
        const desktopPath = getDesktopPath();
        console.log(`✅ Desktop path resolved: ${desktopPath}`);
        
        // Check if the path exists
        if (fs.existsSync(desktopPath)) {
            console.log(`✅ Desktop directory exists`);
            
            // Check if it's writable
            try {
                const testFile = path.join(desktopPath, 'test_write_permission.txt');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log(`✅ Desktop directory is writable`);
            } catch (error) {
                console.log(`⚠️  Desktop directory exists but may not be writable: ${error.message}`);
            }
        } else {
            console.log(`⚠️  Desktop directory does not exist, but path was resolved`);
            
            // Try to create it
            try {
                fs.mkdirSync(desktopPath, { recursive: true });
                console.log(`✅ Successfully created desktop directory`);
            } catch (error) {
                console.log(`❌ Failed to create desktop directory: ${error.message}`);
            }
        }
        
        // Test file path creation
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const testOutputFile = path.join(desktopPath, `test_workout_video_${timestamp}.mp4`);
        console.log(`\nTest output file path: ${testOutputFile}`);
        
        // Check if we can write to the path (without actually creating a file)
        const testDir = path.dirname(testOutputFile);
        if (fs.existsSync(testDir)) {
            console.log(`✅ Output directory is accessible`);
        } else {
            console.log(`❌ Output directory is not accessible`);
        }
        
    } catch (error) {
        console.error(`❌ Error getting desktop path: ${error.message}`);
    }
    
    console.log('\nTest completed!');
}

testDesktopPath(); 