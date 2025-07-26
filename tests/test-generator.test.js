let { 
    printStatus, 
    printWarning, 
    printError, 
    validateNumber, 
    formatExerciseName, 
    checkFfmpeg, 
    getCategories, 
    getEquipment, 
    getExerciseVideosByEquipment,
    selectExercisesEvenly,
    getFfmpegPath,
    getBaseDir,
    getBaseMediaDir,
    getVideosDir,
    runFfmpeg,
    createProgressGridOverlay,
    createCountdownSegment,
    createExerciseSegment,
    createStationChangeSegment,
    createFileList,
    generateWorkoutVideo
} = require('../generator');

// Mock fs and path modules
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock ffmpeg-static
jest.mock('ffmpeg-static', () => 'mocked-ffmpeg-path');

describe('Generator Utility Functions', () => {
  let mockConsoleCallback;
  let mockProgressCallback;

  beforeEach(() => {
    mockConsoleCallback = jest.fn();
    mockProgressCallback = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

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

    test('should handle string input', () => {
      expect(validateNumber('50', 10, 100)).toBe(true);
      expect(validateNumber('5', 10, 100)).toBe(false);
    });

    test('should handle invalid input', () => {
      expect(validateNumber('abc', 10, 100)).toBe(false);
      expect(validateNumber(null, 10, 100)).toBe(false);
      expect(validateNumber(undefined, 10, 100)).toBe(false);
      expect(validateNumber(NaN, 10, 100)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateNumber(0, 0, 100)).toBe(true);
      expect(validateNumber(-1, -10, 10)).toBe(true);
      expect(validateNumber(0.5, 0, 1)).toBe(true); // parseFloat handles decimals
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

  describe('getFfmpegPath', () => {
    test('should return ffmpeg path in development mode', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = null;
      
      const ffmpegPath = getFfmpegPath();
      expect(ffmpegPath).toBe('mocked-ffmpeg-path');
      
      process.mainModule = originalMainModule;
    });

    test('should handle production mode path resolution', () => {
      const originalMainModule = process.mainModule;
      const originalResourcesPath = process.resourcesPath;
      
      // Mock production environment
      process.mainModule = { filename: 'app.asar' };
      process.resourcesPath = '/path/to/resources';
      
      // Mock fs.existsSync to return false for all paths
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      const ffmpegPath = getFfmpegPath();
      expect(ffmpegPath).toBe('mocked-ffmpeg-path');
      
      // Restore
      process.mainModule = originalMainModule;
      process.resourcesPath = originalResourcesPath;
      fs.existsSync = originalExistsSync;
    });

    test('should handle production mode with undefined resourcesPath', () => {
      const originalMainModule = process.mainModule;
      const originalResourcesPath = process.resourcesPath;
      
      // Mock production environment with undefined resourcesPath
      process.mainModule = { filename: 'app.asar' };
      delete process.resourcesPath;
      
      // Mock fs.existsSync to return false for all paths
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      const ffmpegPath = getFfmpegPath();
      expect(ffmpegPath).toBe('mocked-ffmpeg-path');
      
      // Restore
      process.mainModule = originalMainModule;
      process.resourcesPath = originalResourcesPath;
      fs.existsSync = originalExistsSync;
    });
  });

  describe('checkFfmpeg', () => {
    test('should not throw error when FFmpeg is available', () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);
      
      expect(() => checkFfmpeg()).not.toThrow();
      
      fs.existsSync = originalExistsSync;
    });

    test('should call console callback when provided', () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);
      
      checkFfmpeg(mockConsoleCallback);
      expect(mockConsoleCallback).toHaveBeenCalledWith('info', expect.stringContaining('FFMPEG is available'));
      
      fs.existsSync = originalExistsSync;
    });

    test('should handle missing ffmpeg path', () => {
      const originalGetFfmpegPath = getFfmpegPath;
      getFfmpegPath = jest.fn(() => '/path/to/ffmpeg');
      
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      expect(() => checkFfmpeg()).toThrow('FFMPEG executable not found');
      
      getFfmpegPath = originalGetFfmpegPath;
      fs.existsSync = originalExistsSync;
    });

    test('should handle non-existent ffmpeg file', () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      expect(() => checkFfmpeg()).toThrow('FFMPEG executable not found');
      
      fs.existsSync = originalExistsSync;
    });
  });

  describe('getBaseDir', () => {
    test('should return __dirname in development mode', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const baseDir = getBaseDir();
      expect(baseDir).toBe(path.join(__dirname, '..'));
      
      process.mainModule = originalMainModule;
    });

    test('should return resourcesPath in production mode', () => {
      const originalMainModule = process.mainModule;
      const originalResourcesPath = process.resourcesPath;
      
      process.mainModule = { filename: 'app.asar' };
      process.resourcesPath = '/path/to/resources';
      
      const baseDir = getBaseDir();
      expect(baseDir).toBe('/path/to/resources');
      
      process.mainModule = originalMainModule;
      process.resourcesPath = originalResourcesPath;
    });

    test('should handle errors gracefully', () => {
      const originalMainModule = process.mainModule;
      const originalResourcesPath = process.resourcesPath;
      
      process.mainModule = { filename: 'app.asar' };
      process.resourcesPath = undefined;
      
      const baseDir = getBaseDir();
      expect(baseDir).toBe(path.join(__dirname, '..'));
      
      process.mainModule = originalMainModule;
      process.resourcesPath = originalResourcesPath;
    });
  });

  describe('getBaseMediaDir', () => {
    test('should return correct media directory path', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const baseMediaDir = getBaseMediaDir();
      expect(typeof baseMediaDir).toBe('string');
      expect(baseMediaDir).toContain('media');
      
      process.mainModule = originalMainModule;
    });
  });

  describe('getVideosDir', () => {
    test('should return correct videos directory path', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const videosDir = getVideosDir();
      expect(typeof videosDir).toBe('string');
      expect(videosDir).toContain('videos');
      
      process.mainModule = originalMainModule;
    });
  });

  describe('File System Functions', () => {
    test('should load categories successfully', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['strength', 'cardio']);
      fs.statSync = jest.fn(() => ({ isDirectory: () => true }));
      
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
      process.mainModule = originalMainModule;
    });

    test('should load equipment for categories', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['barbell', 'dumbbell']);
      fs.statSync = jest.fn(() => ({ isDirectory: () => true }));
      
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        expect(Array.isArray(equipment)).toBe(true);
        expect(equipment.length).toBeGreaterThan(0);
      }
      
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
      process.mainModule = originalMainModule;
    });

    test('should get exercise videos by equipment', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['exercise.mp4']);
      fs.statSync = jest.fn(() => ({ isDirectory: () => true }));
      
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        if (equipment.length > 0) {
          const videosByEquipment = getExerciseVideosByEquipment(categories.slice(0, 2), equipment.slice(0, 2));
          expect(typeof videosByEquipment).toBe('object');
          expect(Object.keys(videosByEquipment).length).toBeGreaterThan(0);
        }
      }
      
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
      process.mainModule = originalMainModule;
    });

    test('should select exercises evenly', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['exercise.mp4']);
      fs.statSync = jest.fn(() => ({ isDirectory: () => true }));
      
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        if (equipment.length > 0) {
          const selectedExercises = selectExercisesEvenly(5, categories.slice(0, 2), equipment.slice(0, 2));
          expect(Array.isArray(selectedExercises)).toBe(true);
          expect(selectedExercises.length).toBeLessThanOrEqual(5);
        }
      }
      
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
      process.mainModule = originalMainModule;
    });

    test('should handle empty categories array', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const equipment = getEquipment([]);
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBe(0);
      
      process.mainModule = originalMainModule;
    });

    test('should handle non-existent categories', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const equipment = getEquipment(['non-existent-category']);
      expect(Array.isArray(equipment)).toBe(true);
      expect(equipment.length).toBe(0);
      
      process.mainModule = originalMainModule;
    });

    test('should handle empty equipment array', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const videosByEquipment = getExerciseVideosByEquipment(['strength'], []);
      expect(typeof videosByEquipment).toBe('object');
      expect(Object.keys(videosByEquipment).length).toBe(0);
      
      process.mainModule = originalMainModule;
    });

    test('should handle selectExercisesEvenly with console callback', () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalExistsSync = fs.existsSync;
      const originalReaddirSync = fs.readdirSync;
      const originalStatSync = fs.statSync;
      
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['exercise.mp4']);
      fs.statSync = jest.fn(() => ({ isDirectory: () => true }));
      
      const categories = getCategories();
      if (categories.length > 0) {
        const equipment = getEquipment(categories.slice(0, 2));
        if (equipment.length > 0) {
          const selectedExercises = selectExercisesEvenly(5, categories.slice(0, 2), equipment.slice(0, 2), mockConsoleCallback);
          expect(Array.isArray(selectedExercises)).toBe(true);
          expect(mockConsoleCallback).toHaveBeenCalled();
        }
      }
      
      fs.existsSync = originalExistsSync;
      fs.readdirSync = originalReaddirSync;
      fs.statSync = originalStatSync;
      process.mainModule = originalMainModule;
    });
  });

  describe('Print Functions', () => {
    test('should have print functions defined', () => {
      expect(typeof printStatus).toBe('function');
      expect(typeof printWarning).toBe('function');
      expect(typeof printError).toBe('function');
    });

    test('should call console callback when provided', () => {
      printStatus('test message', mockConsoleCallback);
      expect(mockConsoleCallback).toHaveBeenCalledWith('info', 'test message');
      
      printWarning('warning message', mockConsoleCallback);
      expect(mockConsoleCallback).toHaveBeenCalledWith('warn', 'warning message');
      
      printError('error message', mockConsoleCallback);
      expect(mockConsoleCallback).toHaveBeenCalledWith('error', 'error message');
    });

    test('should not call console callback when not provided', () => {
      expect(() => printStatus('test message')).not.toThrow();
      expect(() => printWarning('warning message')).not.toThrow();
      expect(() => printError('error message')).not.toThrow();
    });
  });

  describe('runFfmpeg', () => {
    const { spawn } = require('child_process');



    test('should reject when ffmpeg fails', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        })
      };
      spawn.mockReturnValue(mockProcess);

      // Mock getFfmpegPath to return a valid path
      const originalGetFfmpegPath = getFfmpegPath;
      getFfmpegPath = jest.fn(() => 'mocked-ffmpeg-path');

      const promise = runFfmpeg(['invalid-args']);
      
      // Simulate stderr data
      const stderrCallback = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')[1];
      stderrCallback('error message');
      
      await expect(promise).rejects.toThrow('FFmpeg failed with code 1');
      
      // Restore
      getFfmpegPath = originalGetFfmpegPath;
    });

    test('should reject when ffmpeg process errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Process error'));
          }
        })
      };
      spawn.mockReturnValue(mockProcess);

      // Mock getFfmpegPath to return a valid path
      const originalGetFfmpegPath = getFfmpegPath;
      getFfmpegPath = jest.fn(() => 'mocked-ffmpeg-path');

      const promise = runFfmpeg(['-version']);
      await expect(promise).rejects.toThrow('Process error');
      
      // Restore
      getFfmpegPath = originalGetFfmpegPath;
    });
  });

  describe('createProgressGridOverlay', () => {
    test('should create overlay for single station', () => {
      const overlay = createProgressGridOverlay(0, 1, 1, 3);
      expect(typeof overlay).toBe('string');
      expect(overlay).toContain('drawbox');
      expect(overlay).toContain('drawtext');
    });

    test('should create overlay for multiple stations', () => {
      const overlay = createProgressGridOverlay(1, 2, 3, 4);
      expect(typeof overlay).toBe('string');
      expect(overlay).toContain('drawbox');
      expect(overlay).toContain('drawtext');
    });

    test('should handle current station and set', () => {
      const overlay = createProgressGridOverlay(2, 3, 5, 4);
      expect(overlay).toContain('lightblue'); // Current cell
      expect(overlay).toContain('darkblue');  // Completed cells
    });

    test('should handle edge cases', () => {
      const overlay = createProgressGridOverlay(0, 1, 1, 1);
      expect(typeof overlay).toBe('string');
      expect(overlay.length).toBeGreaterThan(0);
    });
  });

  describe('createFileList', () => {
    test('should create file list content', () => {
      const segments = ['/path/to/segment1.mp4', '/path/to/segment2.mp4'];
      const fileList = '/tmp/filelist.txt';
      
      // Mock fs.writeFileSync
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn();
      
      createFileList(fileList, segments);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(fileList, expect.stringContaining("file '/path/to/segment1.mp4'"));
      expect(fs.writeFileSync).toHaveBeenCalledWith(fileList, expect.stringContaining("file '/path/to/segment2.mp4'"));
      
      fs.writeFileSync = originalWriteFileSync;
    });

    test('should handle empty segments array', () => {
      const fileList = '/tmp/filelist.txt';
      
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn();
      
      createFileList(fileList, []);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(fileList, '');
      
      fs.writeFileSync = originalWriteFileSync;
    });
  });

  describe('createCountdownSegment', () => {






    test('should handle ffmpeg failure', async () => {
      const originalMainModule = process.mainModule;
      process.mainModule = { filename: 'test.js' };
      
      const originalRunFfmpeg = runFfmpeg;
      runFfmpeg = jest.fn().mockRejectedValue(new Error('FFmpeg failed'));
      
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      const result = await createCountdownSegment(10, 'REST', '/tmp/test.mp4', mockConsoleCallback);
      
      expect(result).toBe(false);
      expect(mockConsoleCallback).toHaveBeenCalledWith('error', expect.stringContaining('Failed to create countdown segment'));
      
      runFfmpeg = originalRunFfmpeg;
      fs.existsSync = originalExistsSync;
      process.mainModule = originalMainModule;
    });


  });

  describe('createExerciseSegment', () => {


    test('should handle missing video file', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      const result = await createExerciseSegment(
        '/path/to/missing.mp4',
        30,
        0,
        1,
        3,
        4,
        '/tmp/test.mp4',
        mockConsoleCallback
      );
      
      expect(result).toBe(false);
      expect(mockConsoleCallback).toHaveBeenCalledWith('error', expect.stringContaining('Video file not found'));
      
      fs.existsSync = originalExistsSync;
    });

    test('should handle ffmpeg failure', async () => {
      const originalRunFfmpeg = runFfmpeg;
      runFfmpeg = jest.fn().mockRejectedValue(new Error('FFmpeg failed'));
      
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn((path) => path.includes('exercise.mp4'));
      
      const result = await createExerciseSegment(
        '/path/to/exercise.mp4',
        30,
        0,
        1,
        3,
        4,
        '/tmp/test.mp4',
        mockConsoleCallback
      );
      
      expect(result).toBe(false);
      expect(mockConsoleCallback).toHaveBeenCalledWith('error', expect.stringContaining('Failed to create exercise segment'));
      
      runFfmpeg = originalRunFfmpeg;
      fs.existsSync = originalExistsSync;
    });
  });

  describe('createStationChangeSegment', () => {


    test('should handle missing next exercise file', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);
      
      const result = await createStationChangeSegment(
        15,
        '/path/to/missing.mp4',
        '/tmp/test.mp4',
        mockConsoleCallback
      );
      
      expect(result).toBe(false);
      expect(mockConsoleCallback).toHaveBeenCalledWith('error', expect.stringContaining('Next exercise video not found'));
      
      fs.existsSync = originalExistsSync;
    });
  });

  describe('generateWorkoutVideo', () => {
    test('should validate input parameters', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);
      
      await expect(generateWorkoutVideo(
        5, // Invalid work duration
        15,
        3,
        15,
        60,
        ['strength'],
        ['barbell'],
        mockProgressCallback,
        mockConsoleCallback
      )).rejects.toThrow('Invalid work duration');
      
      fs.existsSync = originalExistsSync;
    });

    test('should handle no exercises fitting in workout time', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);
      
      await expect(generateWorkoutVideo(
        300, // Very long work duration
        120, // Very long rest duration
        10,  // Many sets
        60,  // Long station rest
        1,   // Very short total duration
        ['strength'],
        ['barbell'],
        mockProgressCallback,
        mockConsoleCallback
      )).rejects.toThrow('Invalid total workout duration');
      
      fs.existsSync = originalExistsSync;
    });

    test('should handle no exercise videos found', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);
      
      // Mock getCategories and getEquipment to return empty arrays
      const originalGetCategories = getCategories;
      const originalGetEquipment = getEquipment;
      
      getCategories = jest.fn(() => []);
      getEquipment = jest.fn(() => []);
      
      await expect(generateWorkoutVideo(
        45,
        15,
        3,
        15,
        60,
        [],
        [],
        mockProgressCallback,
        mockConsoleCallback
      )).rejects.toThrow('No exercise videos found or selected');
      
      // Restore original functions
      getCategories = originalGetCategories;
      getEquipment = originalGetEquipment;
      fs.existsSync = originalExistsSync;
    });


  });
}); 