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

describe('Generator Utility Functions', () => {
  describe('validateNumber', () => {
    test('should return true for valid number within range', () => {
      expect(validateNumber(50, 10, 100)).toBe(true);
    });

    test('should return false for number below minimum', () => {
      expect(validateNumber(5, 10, 100)).toBe(false);
    });

    test('should return false for number above maximum', () => {
      expect(validateNumber(150, 10, 100)).toBe(false);
    });

    test('should return true for number at minimum boundary', () => {
      expect(validateNumber(10, 10, 100)).toBe(true);
    });

    test('should return true for number at maximum boundary', () => {
      expect(validateNumber(100, 10, 100)).toBe(true);
    });
  });

  describe('formatExerciseName', () => {
    test('should format exercise name correctly', () => {
      expect(formatExerciseName('Barbell-Squat.mp4')).toBe('Barbell Squat');
      expect(formatExerciseName('push-up.avi')).toBe('Push up');
      expect(formatExerciseName('Dumbbell-Curl.mp4')).toBe('Dumbbell Curl');
    });

    test('should handle various file extensions', () => {
      expect(formatExerciseName('exercise.mov')).toBe('Exercise');
      expect(formatExerciseName('workout.webm')).toBe('Workout');
    });

    test('should handle single word exercises', () => {
      expect(formatExerciseName('Squat.mp4')).toBe('Squat');
      expect(formatExerciseName('Pushup.mp4')).toBe('Pushup');
    });
  });

  describe('checkFfmpeg', () => {
    test('should not throw error when FFmpeg is available', () => {
      expect(() => checkFfmpeg()).not.toThrow();
    });
  });

  describe('File System Functions', () => {
    test('should load categories successfully', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should load equipment for categories', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        expect(Array.isArray(equipment)).toBe(true);
        expect(equipment.length).toBeGreaterThan(0);
      }
    });

    test('should get exercise videos by equipment', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        if (equipment.length > 0) {
          const videosByEquipment = getExerciseVideosByEquipment(categories.slice(0, 2), equipment.slice(0, 2));
          expect(typeof videosByEquipment).toBe('object');
          expect(Object.keys(videosByEquipment).length).toBeGreaterThan(0);
        }
      }
    });

    test('should select exercises evenly', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        if (equipment.length > 0) {
          const selectedExercises = selectExercisesEvenly(5, categories.slice(0, 2), equipment.slice(0, 2));
          expect(Array.isArray(selectedExercises)).toBe(true);
          expect(selectedExercises.length).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('Print Functions', () => {
    test('should have print functions defined', () => {
      expect(typeof printStatus).toBe('function');
      expect(typeof printWarning).toBe('function');
      expect(typeof printError).toBe('function');
    });
  });
}); 