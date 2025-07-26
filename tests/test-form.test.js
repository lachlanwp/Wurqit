let { 
  getCategories, 
  getEquipment, 
  generateWorkoutVideo,
  validateNumber,
  getExerciseVideosByEquipment,
  selectExercisesEvenly,
  formatExerciseName,
  getDesktopPath,
  checkFfmpeg,
  runFfmpeg,
  createExerciseSegment,
  createCountdownSegment,
  createStationChangeSegment
} = require('../generator');

// Mock fs and path modules
const fs = require('fs');
const path = require('path');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock ffmpeg-static
jest.mock('ffmpeg-static', () => 'mocked-ffmpeg-path');

describe('Form Functionality', () => {
  let mockConsoleCallback;
  let mockProgressCallback;

  beforeEach(() => {
    mockConsoleCallback = jest.fn();
    mockProgressCallback = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    test('should load categories successfully', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should return valid category names', () => {
      const categories = getCategories();
      categories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });

    test('should handle missing videos directory', () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      expect(() => getCategories()).toThrow('Videos directory not found');
      
      fs.existsSync = originalExistsSync;
    });

    test('should handle readdirSync errors', () => {
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.readdirSync = jest.fn(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => getCategories()).toThrow('Permission denied');
      
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
    });

    test('should filter out non-directory items', () => {
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.readdirSync = jest.fn(() => ['strength', 'cardio', 'file.txt']);
      fs.statSync = jest.fn((path) => ({
        isDirectory: () => !path.includes('file.txt')
      }));
      
      const categories = getCategories();
      expect(categories).toEqual(['strength', 'cardio']);
      
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
    });
  });

  describe('getEquipment', () => {
    test('should load equipment for categories', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const testCategories = categories.slice(0, 2);
        const equipment = getEquipment(testCategories);
        expect(Array.isArray(equipment)).toBe(true);
        expect(equipment.length).toBeGreaterThan(0);
      }
    });

    test('should return valid equipment names', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const testCategories = categories.slice(0, 2);
        const equipment = getEquipment(testCategories);
        equipment.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item.length).toBeGreaterThan(0);
        });
      }
    });

    test('should handle empty categories array', () => {
      const equipment = getEquipment([]);
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBe(0);
    });

    test('should handle non-existent categories', () => {
      const equipment = getEquipment(['non-existent-category']);
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBe(0);
    });

    test('should handle readdirSync errors gracefully', () => {
      const originalReaddirSync = fs.readdirSync;
      fs.readdirSync = jest.fn(() => {
        throw new Error('Permission denied');
      });
      
      const equipment = getEquipment(['strength']);
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBe(0);
      
      fs.readdirSync = originalReaddirSync;
    });

    test('should filter out non-directory items', () => {
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.readdirSync = jest.fn(() => ['barbell', 'dumbbell', 'file.txt']);
      fs.statSync = jest.fn((path) => ({
        isDirectory: () => !path.includes('file.txt')
      }));
      
      const equipment = getEquipment(['strength']);
      expect(equipment).toEqual(['barbell', 'dumbbell']);
      
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
    });
  });

  describe('getExerciseVideosByEquipment', () => {
    test('should get exercise videos by equipment', () => {
      const originalGetCategories = getCategories;
      const originalGetEquipment = getEquipment;
      
      getCategories = jest.fn(() => ['strength']);
      getEquipment = jest.fn(() => ['barbell']);
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['exercise.mp4']);
      
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], ['barbell']);
      expect(typeof videosByEquipment).toBe('object');
      expect(Object.keys(videosByEquipment).length).toBeGreaterThan(0);
      
      // Restore
      getCategories = originalGetCategories;
      getEquipment = originalGetEquipment;
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
    });

    test('should handle empty equipment array', () => {
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], []);
      expect(typeof videosByEquipment).toBe('object');
      expect(Object.keys(videosByEquipment).length).toBe(0);
    });

    test('should handle non-existent equipment directories', () => {
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], ['non-existent-equipment']);
      expect(typeof videosByEquipment).toBe('object');
      expect(videosByEquipment['non-existent-equipment']).toEqual([]);
    });

    test('should filter for MP4 files only', () => {
      const originalReaddirSync = fs.readdirSync;
      const originalExistsSync = fs.existsSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['exercise.mp4', 'workout.avi', 'test.txt', 'video.MP4']);
      
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], ['barbell']);
      expect(videosByEquipment['barbell']).toHaveLength(2);
      expect(videosByEquipment['barbell'][0]).toContain('exercise.mp4');
      expect(videosByEquipment['barbell'][1]).toContain('video.MP4');
      
      fs.readdirSync = originalReaddirSync;
      fs.existsSync = originalExistsSync;
    });

    test('should handle readdirSync errors gracefully', () => {
      const originalReaddirSync = fs.readdirSync;
      const originalExistsSync = fs.existsSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => {
        throw new Error('Permission denied');
      });
      
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], ['barbell']);
      expect(videosByEquipment['barbell']).toEqual([]);
      
      fs.readdirSync = originalReaddirSync;
      fs.existsSync = originalExistsSync;
    });
  });

  describe('selectExercisesEvenly', () => {
    test('should select exercises evenly', () => {
      const originalGetExerciseVideosByEquipment = getExerciseVideosByEquipment;
      
      getExerciseVideosByEquipment = jest.fn(() => ({
        'barbell': ['/path/to/barbell1.mp4', '/path/to/barbell2.mp4'],
        'dumbbell': ['/path/to/dumbbell1.mp4']
      }));
      
      const selectedExercises = selectExercisesEvenly(3, ['strength'], ['barbell', 'dumbbell'], mockConsoleCallback);
      expect(Array.isArray(selectedExercises)).toBe(true);
      expect(selectedExercises.length).toBe(3);
      
      getExerciseVideosByEquipment = originalGetExerciseVideosByEquipment;
    });

    test('should handle console callback', () => {
      const originalGetExerciseVideosByEquipment = getExerciseVideosByEquipment;
      
      getExerciseVideosByEquipment = jest.fn(() => ({
        'barbell': ['/path/to/barbell1.mp4'],
        'dumbbell': ['/path/to/dumbbell1.mp4']
      }));
      
      const selectedExercises = selectExercisesEvenly(2, ['strength'], ['barbell', 'dumbbell'], mockConsoleCallback);
      expect(Array.isArray(selectedExercises)).toBe(true);
      expect(mockConsoleCallback).toHaveBeenCalled();
      
      getExerciseVideosByEquipment = originalGetExerciseVideosByEquipment;
    });



    test('should distribute exercises evenly', () => {
      const originalGetExerciseVideosByEquipment = getExerciseVideosByEquipment;
      
      getExerciseVideosByEquipment = jest.fn(() => ({
        'barbell': ['/path/to/barbell1.mp4', '/path/to/barbell2.mp4', '/path/to/barbell3.mp4'],
        'dumbbell': ['/path/to/dumbbell1.mp4', '/path/to/dumbbell2.mp4']
      }));
      
      const selectedExercises = selectExercisesEvenly(4, ['strength'], ['barbell', 'dumbbell'], mockConsoleCallback);
      expect(selectedExercises.length).toBe(4);
      
      // Restore original function
      getExerciseVideosByEquipment = originalGetExerciseVideosByEquipment;
    });

    test('should handle remaining exercises distribution', () => {
      const originalGetExerciseVideosByEquipment = getExerciseVideosByEquipment;
      getExerciseVideosByEquipment = jest.fn(() => ({
        'barbell': ['/path/to/barbell1.mp4', '/path/to/barbell2.mp4'],
        'dumbbell': ['/path/to/dumbbell1.mp4'],
        'kettlebell': ['/path/to/kettlebell1.mp4']
      }));
      
      const selectedExercises = selectExercisesEvenly(5, ['strength'], ['barbell', 'dumbbell', 'kettlebell'], mockConsoleCallback);
      expect(selectedExercises.length).toBe(4); // Only 4 videos available (2+1+1)
      
      getExerciseVideosByEquipment = originalGetExerciseVideosByEquipment;
    });
  });

  describe('Form Data Structure', () => {
    test('should validate form data structure', () => {
      const mockFormData = {
        workDuration: 45,
        restDuration: 15,
        setsPerStation: 3,
        stationRest: 15,
        totalWorkoutDuration: 60,
        categories: ['strength', 'cardio'],
        equipment: ['barbell', 'dumbbell']
      };

      expect(mockFormData).toHaveProperty('workDuration');
      expect(mockFormData).toHaveProperty('restDuration');
      expect(mockFormData).toHaveProperty('setsPerStation');
      expect(mockFormData).toHaveProperty('stationRest');
      expect(mockFormData).toHaveProperty('totalWorkoutDuration');
      expect(mockFormData).toHaveProperty('categories');
      expect(mockFormData).toHaveProperty('equipment');

      expect(typeof mockFormData.workDuration).toBe('number');
      expect(typeof mockFormData.restDuration).toBe('number');
      expect(typeof mockFormData.setsPerStation).toBe('number');
      expect(typeof mockFormData.stationRest).toBe('number');
      expect(typeof mockFormData.totalWorkoutDuration).toBe('number');
      expect(Array.isArray(mockFormData.categories)).toBe(true);
      expect(Array.isArray(mockFormData.equipment)).toBe(true);
    });

    test('should validate form data with edge values', () => {
      const mockFormData = {
        workDuration: 10, // Minimum
        restDuration: 5,  // Minimum
        setsPerStation: 1, // Minimum
        stationRest: 5,   // Minimum
        totalWorkoutDuration: 5, // Minimum
        categories: ['strength'],
        equipment: ['barbell']
      };

      expect(validateNumber(mockFormData.workDuration, 10, 300)).toBe(true);
      expect(validateNumber(mockFormData.restDuration, 5, 120)).toBe(true);
      expect(validateNumber(mockFormData.setsPerStation, 1, 10)).toBe(true);
      expect(validateNumber(mockFormData.stationRest, 5, 60)).toBe(true);
      expect(validateNumber(mockFormData.totalWorkoutDuration, 5, 180)).toBe(true);
    });

    test('should validate form data with maximum values', () => {
      const mockFormData = {
        workDuration: 300, // Maximum
        restDuration: 120, // Maximum
        setsPerStation: 10, // Maximum
        stationRest: 60,   // Maximum
        totalWorkoutDuration: 180, // Maximum
        categories: ['strength'],
        equipment: ['barbell']
      };

      expect(validateNumber(mockFormData.workDuration, 10, 300)).toBe(true);
      expect(validateNumber(mockFormData.restDuration, 5, 120)).toBe(true);
      expect(validateNumber(mockFormData.setsPerStation, 1, 10)).toBe(true);
      expect(validateNumber(mockFormData.stationRest, 5, 60)).toBe(true);
      expect(validateNumber(mockFormData.totalWorkoutDuration, 5, 180)).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    test('should validate work duration', () => {
      expect(validateNumber(45, 10, 300)).toBe(true);
      expect(validateNumber(5, 10, 300)).toBe(false);
      expect(validateNumber(400, 10, 300)).toBe(false);
    });

    test('should validate rest duration', () => {
      expect(validateNumber(15, 5, 120)).toBe(true);
      expect(validateNumber(3, 5, 120)).toBe(false);
      expect(validateNumber(150, 5, 120)).toBe(false);
    });

    test('should validate sets per station', () => {
      expect(validateNumber(3, 1, 10)).toBe(true);
      expect(validateNumber(0, 1, 10)).toBe(false);
      expect(validateNumber(15, 1, 10)).toBe(false);
    });

    test('should validate station rest', () => {
      expect(validateNumber(15, 5, 60)).toBe(true);
      expect(validateNumber(3, 5, 60)).toBe(false);
      expect(validateNumber(80, 5, 60)).toBe(false);
    });

    test('should validate total workout duration', () => {
      expect(validateNumber(60, 5, 180)).toBe(true);
      expect(validateNumber(3, 5, 180)).toBe(false);
      expect(validateNumber(200, 5, 180)).toBe(false);
    });

    test('should handle string input validation', () => {
      expect(validateNumber('45', 10, 300)).toBe(true);
      expect(validateNumber('abc', 10, 300)).toBe(false);
      expect(validateNumber('', 10, 300)).toBe(false);
    });

    test('should handle null and undefined input', () => {
      expect(validateNumber(null, 10, 300)).toBe(false);
      expect(validateNumber(undefined, 10, 300)).toBe(false);
      expect(validateNumber(NaN, 10, 300)).toBe(false);
    });
  });

  describe('Boundary Values', () => {
    test('should accept minimum valid values', () => {
      expect(validateNumber(10, 10, 300)).toBe(true);
      expect(validateNumber(5, 5, 120)).toBe(true);
      expect(validateNumber(1, 1, 10)).toBe(true);
    });

    test('should accept maximum valid values', () => {
      expect(validateNumber(300, 10, 300)).toBe(true);
      expect(validateNumber(120, 5, 120)).toBe(true);
      expect(validateNumber(10, 1, 10)).toBe(true);
    });

    test('should reject values outside boundaries', () => {
      expect(validateNumber(9, 10, 300)).toBe(false);
      expect(validateNumber(301, 10, 300)).toBe(false);
      expect(validateNumber(4, 5, 120)).toBe(false);
      expect(validateNumber(121, 5, 120)).toBe(false);
    });

    test('should handle zero values appropriately', () => {
      expect(validateNumber(0, 0, 100)).toBe(true);
      expect(validateNumber(0, 1, 100)).toBe(false);
    });

    test('should handle negative values appropriately', () => {
      expect(validateNumber(-1, -10, 10)).toBe(true);
      expect(validateNumber(-1, 0, 10)).toBe(false);
    });
  });

  describe('formatExerciseName', () => {
    test('should format exercise names correctly', () => {
      expect(formatExerciseName('Barbell-Squat.mp4')).toBe('Barbell Squat');
      expect(formatExerciseName('push-up.avi')).toBe('Push up');
      expect(formatExerciseName('Dumbbell-Curl.mp4')).toBe('Dumbbell Curl');
    });

    test('should handle various file extensions', () => {
      expect(formatExerciseName('exercise.mov')).toBe('Exercise');
      expect(formatExerciseName('workout.webm')).toBe('Workout');
      expect(formatExerciseName('test.MP4')).toBe('Test');
    });

    test('should handle single word exercises', () => {
      expect(formatExerciseName('Squat.mp4')).toBe('Squat');
      expect(formatExerciseName('Pushup.mp4')).toBe('Pushup');
    });

    test('should handle multiple hyphens', () => {
      expect(formatExerciseName('Barbell-Bench-Press.mp4')).toBe('Barbell Bench Press');
      expect(formatExerciseName('Dumbbell-Curl-Exercise.mp4')).toBe('Dumbbell Curl Exercise');
    });

    test('should handle files without extensions', () => {
      expect(formatExerciseName('exercise')).toBe('Exercise');
      expect(formatExerciseName('workout')).toBe('Workout');
    });

    test('should handle empty strings', () => {
      expect(formatExerciseName('')).toBe('');
    });

    test('should handle special characters', () => {
      expect(formatExerciseName('exercise@test.mp4')).toBe('Exercise@test');
      expect(formatExerciseName('workout#1.mp4')).toBe('Workout#1');
    });
  });

  describe('getDesktopPath', () => {
    test('should return valid desktop path', () => {
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath.length).toBeGreaterThan(0);
    });

    test('should handle different platforms', () => {
      const originalPlatform = process.platform;
      
      // Test Windows
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
      const winPath = getDesktopPath();
      expect(winPath).toContain('Desktop');
      
      // Test macOS
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
      const macPath = getDesktopPath();
      expect(macPath).toContain('Desktop');
      
      // Test Linux
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
      const linuxPath = getDesktopPath();
      expect(linuxPath).toContain('Desktop');
      
      // Restore
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    });

    test('should handle unsupported platforms', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'unsupported', writable: true });
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    });
  });




}); 