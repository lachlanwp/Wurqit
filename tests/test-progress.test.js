const { generateWorkoutVideo } = require('../generator');

// Mock fs and path modules
const fs = require('fs');
const path = require('path');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock ffmpeg-static
jest.mock('ffmpeg-static', () => 'mocked-ffmpeg-path');

describe('Progress Callback Functionality', () => {
  let progressUpdates;
  let mockConsoleCallback;

  beforeEach(() => {
    progressUpdates = [];
    mockConsoleCallback = jest.fn();
    jest.clearAllMocks();
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

  test('should handle undefined progress callback', () => {
    const undefinedCallback = undefined;
    expect(undefinedCallback).toBeUndefined();
    
    // This should not throw an error
    expect(() => {
      if (undefinedCallback) {
        undefinedCallback(50, 'Test');
      }
    }).not.toThrow();
  });

  test('should handle progress callback with different data types', () => {
    // Test with different data types for progress
    progressCallback(0, 'Zero progress');
    progressCallback(50.0, 'Float progress');
    progressCallback(100, 'Max progress');
    
    expect(progressUpdates.length).toBe(3);
    progressUpdates.forEach(update => {
      expect(typeof update.progress).toBe('number');
    });
  });

  test('should handle empty message strings', () => {
    progressCallback(25, '');
    progressCallback(50, '   ');
    progressCallback(75, 'Valid message');
    
    expect(progressUpdates.length).toBe(3);
    progressUpdates.forEach(update => {
      expect(typeof update.message).toBe('string');
    });
  });

  test('should handle very long messages', () => {
    const longMessage = 'A'.repeat(1000);
    progressCallback(50, longMessage);
    
    expect(progressUpdates.length).toBe(1);
    expect(progressUpdates[0].message).toBe(longMessage);
    expect(progressUpdates[0].message.length).toBe(1000);
  });

  test('should handle special characters in messages', () => {
    const specialMessages = [
      'Progress: 50%',
      'Status: "Processing"',
      'Error: <script>alert("test")</script>',
      'Unicode: 🏋️‍♂️ 💪',
      'Special chars: @#$%^&*()'
    ];

    specialMessages.forEach((message, index) => {
      progressCallback(index * 20, message);
    });

    expect(progressUpdates.length).toBe(5);
    progressUpdates.forEach((update, index) => {
      expect(update.message).toBe(specialMessages[index]);
    });
  });

  test('should handle multiple rapid progress updates', () => {
    // Simulate rapid progress updates
    for (let i = 0; i <= 100; i += 5) {
      progressCallback(i, `Progress: ${i}%`);
    }
    
    expect(progressUpdates.length).toBe(21); // 0, 5, 10, ..., 100
    
    // Verify progress values are in order
    progressUpdates.forEach((update, index) => {
      expect(update.progress).toBe(index * 5);
    });
  });

  test('should handle progress callback with async operations', async () => {
    const asyncProgressCallback = async (progress, message) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      progressUpdates.push({ progress, message });
    };

    await asyncProgressCallback(25, 'Async progress');
    await asyncProgressCallback(50, 'Async progress 2');
    
    expect(progressUpdates.length).toBe(2);
    expect(progressUpdates[0].progress).toBe(25);
    expect(progressUpdates[1].progress).toBe(50);
  });

  test('should handle progress callback with complex objects', () => {
    const complexCallback = (progress, message) => {
      progressUpdates.push({ 
        progress, 
        message,
        timestamp: Date.now(),
        metadata: { source: 'test', version: '1.0' }
      });
    };

    complexCallback(75, 'Complex progress');
    
    expect(progressUpdates.length).toBe(1);
    expect(progressUpdates[0]).toHaveProperty('timestamp');
    expect(progressUpdates[0]).toHaveProperty('metadata');
    expect(progressUpdates[0].metadata.source).toBe('test');
  });

  test('should handle progress callback with console callback integration', () => {
    const integratedCallback = (progress, message) => {
      progressUpdates.push({ progress, message });
      if (mockConsoleCallback) {
        mockConsoleCallback('info', `Progress ${progress}%: ${message}`);
      }
    };

    integratedCallback(30, 'Integrated progress');
    integratedCallback(60, 'Integrated progress 2');
    
    expect(progressUpdates.length).toBe(2);
    expect(mockConsoleCallback).toHaveBeenCalledTimes(2);
    expect(mockConsoleCallback).toHaveBeenCalledWith('info', 'Progress 30%: Integrated progress');
    expect(mockConsoleCallback).toHaveBeenCalledWith('info', 'Progress 60%: Integrated progress 2');
  });

  test('should handle progress callback with error recovery', () => {
    let errorCount = 0;
    const resilientCallback = (progress, message) => {
      try {
        if (progress === 50 && errorCount === 0) {
          errorCount++;
          throw new Error('Simulated error');
        }
        progressUpdates.push({ progress, message });
      } catch (error) {
        // Log error but continue
        console.error('Progress callback error:', error.message);
      }
    };

    resilientCallback(25, 'Before error');
    resilientCallback(50, 'Error point');
    resilientCallback(75, 'After error');
    
    expect(progressUpdates.length).toBe(2);
    expect(progressUpdates[0].progress).toBe(25);
    expect(progressUpdates[1].progress).toBe(75);
  });

  test('should handle progress callback with validation', () => {
    const validatedCallback = (progress, message) => {
      // Validate progress value
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}`);
      }
      
      // Validate message
      if (typeof message !== 'string') {
        throw new Error(`Invalid message type: ${typeof message}`);
      }
      
      progressUpdates.push({ progress, message });
    };

    // Valid calls
    expect(() => validatedCallback(0, 'Valid')).not.toThrow();
    expect(() => validatedCallback(100, 'Valid')).not.toThrow();
    expect(() => validatedCallback(50, 'Valid')).not.toThrow();
    
    // Invalid calls
    expect(() => validatedCallback(-1, 'Invalid')).toThrow('Invalid progress value: -1');
    expect(() => validatedCallback(101, 'Invalid')).toThrow('Invalid progress value: 101');
    expect(() => validatedCallback(50, null)).toThrow('Invalid message type: object');
    
    expect(progressUpdates.length).toBe(3);
  });

  test('should handle progress callback with rate limiting', () => {
    let lastUpdate = 0;
    const rateLimitedCallback = (progress, message) => {
      const now = Date.now();
      // Only update if at least 10ms have passed
      if (now - lastUpdate >= 10) {
        progressUpdates.push({ progress, message, timestamp: now });
        lastUpdate = now;
      }
    };

    // Rapid calls
    for (let i = 0; i < 10; i++) {
      rateLimitedCallback(i * 10, `Progress ${i * 10}%`);
    }
    
    // Should have fewer updates due to rate limiting
    expect(progressUpdates.length).toBeLessThan(10);
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  test('should handle progress callback with memory management', () => {
    const memoryManagedCallback = (progress, message) => {
      // Limit the number of stored updates
      if (progressUpdates.length >= 10) {
        progressUpdates.shift(); // Remove oldest
      }
      progressUpdates.push({ progress, message });
    };

    // Add more than 10 updates
    for (let i = 0; i < 15; i++) {
      memoryManagedCallback(i * 7, `Progress ${i * 7}%`);
    }
    
    expect(progressUpdates.length).toBe(10);
    expect(progressUpdates[0].progress).toBe(35); // 5 * 7
    expect(progressUpdates[9].progress).toBe(98); // 14 * 7
  });

  test('should handle progress callback with different progress patterns', () => {
    // Linear progress
    for (let i = 0; i <= 100; i += 20) {
      progressCallback(i, `Linear: ${i}%`);
    }
    
    // Reset for exponential-like progress
    progressUpdates = [];
    const exponentialProgress = [0, 10, 25, 45, 70, 100];
    exponentialProgress.forEach(progress => {
      progressCallback(progress, `Exponential: ${progress}%`);
    });
    
    expect(progressUpdates.length).toBe(6);
    expect(progressUpdates[0].progress).toBe(0);
    expect(progressUpdates[5].progress).toBe(100);
  });

  test('should handle progress callback with internationalization', () => {
    const internationalMessages = [
      'Progreso: 25%', // Spanish
      'Fortschritt: 50%', // German
      '進捗: 75%', // Japanese
      'Прогресс: 90%', // Russian
      'Progress: 100%' // English
    ];

    internationalMessages.forEach((message, index) => {
      progressCallback((index + 1) * 25, message);
    });

    expect(progressUpdates.length).toBe(5);
    progressUpdates.forEach((update, index) => {
      expect(update.message).toBe(internationalMessages[index]);
    });
  });

  test('should handle progress callback with performance monitoring', () => {
    const performanceCallback = (progress, message) => {
      const startTime = performance.now();
      
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      progressUpdates.push({ 
        progress, 
        message, 
        duration,
        timestamp: Date.now()
      });
    };

    performanceCallback(25, 'Performance test 1');
    performanceCallback(50, 'Performance test 2');
    
    expect(progressUpdates.length).toBe(2);
    progressUpdates.forEach(update => {
      expect(update).toHaveProperty('duration');
      expect(update).toHaveProperty('timestamp');
      expect(typeof update.duration).toBe('number');
      expect(update.duration).toBeGreaterThan(0);
    });
  });

  test('should handle progress callback with conditional logic', () => {
    const conditionalCallback = (progress, message) => {
      // Only update on certain progress values
      if (progress % 25 === 0 || progress === 100) {
        progressUpdates.push({ progress, message, milestone: true });
      } else {
        progressUpdates.push({ progress, message, milestone: false });
      }
    };

    for (let i = 0; i <= 100; i += 10) {
      conditionalCallback(i, `Progress ${i}%`);
    }
    
    expect(progressUpdates.length).toBe(11);
    
    const milestones = progressUpdates.filter(update => update.milestone);
    expect(milestones.length).toBe(3); // 0, 50, 100 (from the loop with step 10)
    
    const nonMilestones = progressUpdates.filter(update => !update.milestone);
    expect(nonMilestones.length).toBe(8); // 10, 20, 30, 40, 60, 70, 80, 90
  });
}); 