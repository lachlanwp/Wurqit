const { 
    printStatus, 
    printWarning, 
    printError, 
    validateNumber, 
    formatExerciseName, 
    checkFfmpeg, 
    getCategories, 
    getEquipment, 
    getExerciseVideosByEquipment,
    selectExercisesEvenly
} = require('../generator');

// Test utility functions
console.log('Testing utility functions...');

// Test validateNumber
console.log('validateNumber(50, 10, 100):', validateNumber(50, 10, 100)); // should be true
console.log('validateNumber(5, 10, 100):', validateNumber(5, 10, 100)); // should be false
console.log('validateNumber(150, 10, 100):', validateNumber(150, 10, 100)); // should be false

// Test formatExerciseName
console.log('formatExerciseName("Barbell-Squat.mp4"):', formatExerciseName('Barbell-Squat.mp4')); // should be "Barbell squat"
console.log('formatExerciseName("push-up.avi"):', formatExerciseName('push-up.avi')); // should be "Push up"

// Test checkFfmpeg
try {
    checkFfmpeg();
    console.log('FFmpeg check passed');
} catch (error) {
    console.error('FFmpeg check failed:', error.message);
}

// Test file system functions
console.log('\nTesting file system functions...');

try {
    const categories = getCategories();
    console.log('Available categories:', categories);
    
    if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2)); // Test with first 2 categories
        console.log('Available equipment for first 2 categories:', equipment);
        
        if (equipment.length > 0) {
            const videosByEquipment = getExerciseVideosByEquipment(categories.slice(0, 2), equipment.slice(0, 2));
            console.log('Videos by equipment:', Object.keys(videosByEquipment));
            
            // Test exercise selection
            const selectedExercises = selectExercisesEvenly(5, categories.slice(0, 2), equipment.slice(0, 2));
            console.log('Selected exercises:', selectedExercises.length);
        }
    }
} catch (error) {
    console.error('File system test failed:', error.message);
}

console.log('\nTest completed!'); 