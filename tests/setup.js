// Test setup file
const fs = require('fs');
const path = require('path');

// Mock process.resourcesPath for tests
if (!process.resourcesPath) {
  process.resourcesPath = path.join(__dirname, '..');
}

// Mock process.mainModule for tests
if (!process.mainModule) {
  process.mainModule = {
    filename: __filename
  };
}

// Create mock videos directory structure for tests
const mockVideosDir = path.join(__dirname, '..', 'media', 'videos');
if (!fs.existsSync(mockVideosDir)) {
  // Create the directory structure
  const categories = ['strength', 'cardio', 'plyometrics', 'stretching'];
  const equipment = {
    strength: ['barbell', 'dumbbell', 'kettlebells', 'machine'],
    cardio: ['machine', 'other'],
    plyometrics: ['body only', 'dumbbell', 'medicine ball', 'other'],
    stretching: ['body only', 'exercise ball', 'foam roll', 'other']
  };

  // Create directories
  categories.forEach(category => {
    const categoryDir = path.join(mockVideosDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    if (equipment[category]) {
      equipment[category].forEach(eq => {
        const equipmentDir = path.join(categoryDir, eq);
        if (!fs.existsSync(equipmentDir)) {
          fs.mkdirSync(equipmentDir, { recursive: true });
        }
        
        // Create a mock video file
        const mockVideoPath = path.join(equipmentDir, 'mock-exercise.mp4');
        if (!fs.existsSync(mockVideoPath)) {
          fs.writeFileSync(mockVideoPath, 'mock video content');
        }
      });
    }
  });
}

// Mock console methods to prevent output during tests
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Restore console after tests
afterAll(() => {
  global.console = originalConsole;
}); 