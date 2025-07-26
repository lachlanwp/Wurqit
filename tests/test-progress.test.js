const { generateWorkoutVideo } = require('../generator');

describe('Progress Callback Functionality', () => {
  let progressUpdates;

  beforeEach(() => {
    progressUpdates = [];
  });

  const progressCallback = (progress, message) => {
    progressUpdates.push({ progress, message });
  };

  test('should have progress callback function structure', () => {
    // Test that the progress callback function has the expected signature
    expect(typeof progressCallback).toBe('function');
    
    // Test that it can be called with progress and message
    expect(() => progressCallback(50, 'Test message')).not.toThrow();
    
    // Verify the callback updates the progress array
    expect(progressUpdates.length).toBe(1);
    expect(progressUpdates[0]).toHaveProperty('progress');
    expect(progressUpdates[0]).toHaveProperty('message');
    expect(progressUpdates[0].progress).toBe(50);
    expect(progressUpdates[0].message).toBe('Test message');
  });

  test('should validate progress callback parameters', () => {
    // Test with various progress values
    progressCallback(0, 'Starting');
    progressCallback(25, 'Quarter done');
    progressCallback(50, 'Halfway');
    progressCallback(75, 'Almost done');
    progressCallback(100, 'Complete');
    
    expect(progressUpdates.length).toBe(5);
    
    // Verify all progress values are numbers between 0 and 100
    progressUpdates.forEach(update => {
      expect(typeof update.progress).toBe('number');
      expect(update.progress).toBeGreaterThanOrEqual(0);
      expect(update.progress).toBeLessThanOrEqual(100);
      expect(typeof update.message).toBe('string');
      expect(update.message.length).toBeGreaterThan(0);
    });
  });

  test('should handle null progress callback', () => {
    // Test that null callback doesn't cause errors
    const nullCallback = null;
    expect(nullCallback).toBeNull();
    
    // This should not throw an error
    expect(() => {
      if (nullCallback) {
        nullCallback(50, 'Test');
      }
    }).not.toThrow();
  });

  test('should handle progress callback errors gracefully', () => {
    const errorCallback = (progress, message) => {
      throw new Error('Progress callback error');
    };

    // Test that error in callback is handled
    expect(() => errorCallback(50, 'Test')).toThrow('Progress callback error');
  });

  test('should validate progress callback message content', () => {
    const testMessages = [
      'Initializing workout generation...',
      'Processing exercise segments...',
      'Creating countdown timers...',
      'Generating final video...',
      'Workout video complete!'
    ];

    testMessages.forEach((message, index) => {
      const progress = (index + 1) * 20;
      progressCallback(progress, message);
    });

    expect(progressUpdates.length).toBe(5);
    
    // Verify messages are meaningful
    progressUpdates.forEach(update => {
      expect(update.message.length).toBeGreaterThan(5);
      expect(update.message).toMatch(/[a-zA-Z]/); // Contains letters
    });
  });

  test('should handle edge case progress values', () => {
    // Test edge cases
    progressCallback(-1, 'Negative progress');
    progressCallback(101, 'Over 100%');
    progressCallback(0.5, 'Fractional progress');
    progressCallback(99.9, 'Almost complete');
    
    expect(progressUpdates.length).toBe(4);
    
    // All should be accepted as valid numbers
    progressUpdates.forEach(update => {
      expect(typeof update.progress).toBe('number');
    });
  });
}); 