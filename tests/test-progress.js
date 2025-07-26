const { generateWorkoutVideo } = require('../generator');

async function testProgressCallback() {
  console.log('Testing progress callback functionality...\n');
  
  let progressUpdates = [];
  
  const progressCallback = (progress, message) => {
    progressUpdates.push({ progress, message });
    console.log(`[${progress}%] ${message}`);
  };
  
  try {
    // Test with minimal parameters
    const result = await generateWorkoutVideo(
      30, // workDuration
      10, // restDuration
      2,  // setsPerStation
      10, // stationRest
      10, // totalWorkoutDuration (10 minutes)
      ['strength'], // categories
      ['dumbbell'], // equipment
      progressCallback
    );
    
    console.log('\n✅ Progress callback test completed successfully!');
    console.log(`Output file: ${result}`);
    console.log(`Total progress updates: ${progressUpdates.length}`);
    
    // Show all progress updates
    console.log('\nProgress updates:');
    progressUpdates.forEach((update, index) => {
      console.log(`${index + 1}. [${update.progress}%] ${update.message}`);
    });
    
  } catch (error) {
    console.error('❌ Progress callback test failed:', error.message);
  }
}

testProgressCallback(); 