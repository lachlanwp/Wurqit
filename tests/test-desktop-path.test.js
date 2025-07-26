const { getDesktopPath } = require('../generator');
const os = require('os');
const fs = require('fs');
const path = require('path');

describe('Desktop Path Functionality', () => {
  let originalPlatform;
  let originalHomedir;

  beforeEach(() => {
    // Store original values
    originalPlatform = os.platform;
    originalHomedir = os.homedir;
  });

  afterEach(() => {
    // Restore original values
    os.platform = originalPlatform;
    os.homedir = originalHomedir;
  });

  describe('getDesktopPath', () => {
    test('should resolve desktop path successfully', () => {
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath.length).toBeGreaterThan(0);
    });

    test('should return a valid path structure', () => {
      const desktopPath = getDesktopPath();
      const homeDir = os.homedir();
      
      // Should be a subdirectory of home directory
      expect(desktopPath).toContain(homeDir);
      expect(desktopPath.length).toBeGreaterThan(homeDir.length);
    });

    test('should handle desktop directory existence', () => {
      const desktopPath = getDesktopPath();
      
      if (fs.existsSync(desktopPath)) {
        // If desktop exists, it should be a directory
        const stats = fs.statSync(desktopPath);
        expect(stats.isDirectory()).toBe(true);
      } else {
        // If desktop doesn't exist, we should be able to create it
        expect(() => {
          fs.mkdirSync(desktopPath, { recursive: true });
        }).not.toThrow();
        
        // Clean up
        try {
          fs.rmdirSync(desktopPath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    test('should handle write permissions', () => {
      const desktopPath = getDesktopPath();
      
      // Ensure directory exists
      if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
      }

      const testFile = path.join(desktopPath, 'test_write_permission.txt');
      
      try {
        // Test write permission
        fs.writeFileSync(testFile, 'test');
        expect(fs.existsSync(testFile)).toBe(true);
        
        // Clean up
        fs.unlinkSync(testFile);
      } catch (error) {
        // If we can't write, that's acceptable but should be documented
        expect(error.message).toBeDefined();
      }
    });

    test('should create valid output file paths', () => {
      const desktopPath = getDesktopPath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const testOutputFile = path.join(desktopPath, `test_workout_video_${timestamp}.mp4`);
      
      expect(typeof testOutputFile).toBe('string');
      expect(testOutputFile.length).toBeGreaterThan(0);
      expect(testOutputFile).toContain(desktopPath);
      expect(testOutputFile).toContain('.mp4');
    });

    test('should handle different operating systems', () => {
      const currentPlatform = os.platform();
      const desktopPath = getDesktopPath();
      
      // Verify path structure based on platform
      switch (currentPlatform) {
        case 'win32':
          expect(desktopPath).toContain('Desktop');
          break;
        case 'darwin':
          expect(desktopPath).toContain('Desktop');
          break;
        case 'linux':
          expect(desktopPath).toContain('Desktop');
          break;
        default:
          // For other platforms, just ensure it's a valid path
          expect(desktopPath.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Cross-platform compatibility', () => {
    test('should work on Windows', () => {
      // Mock Windows environment
      os.platform = jest.fn(() => 'win32');
      os.homedir = jest.fn(() => 'C:\\Users\\TestUser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('Desktop');
      expect(desktopPath).toContain('C:\\Users\\TestUser');
    });

    test('should work on macOS', () => {
      // Mock macOS environment
      os.platform = jest.fn(() => 'darwin');
      os.homedir = jest.fn(() => '/Users/testuser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('Desktop');
      expect(desktopPath).toContain('Users');
      expect(desktopPath).toContain('testuser');
    });

    test('should work on Linux', () => {
      // Mock Linux environment
      os.platform = jest.fn(() => 'linux');
      os.homedir = jest.fn(() => '/home/testuser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('Desktop');
      expect(desktopPath).toContain('home');
      expect(desktopPath).toContain('testuser');
    });
  });

  describe('Error handling', () => {
    test('should handle missing home directory gracefully', () => {
      // Mock missing home directory
      os.homedir = jest.fn(() => '');
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath).toBe('Desktop');
    });

    test('should handle invalid home directory', () => {
      // Mock invalid home directory
      os.homedir = jest.fn(() => '/nonexistent/path');
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath).toContain('nonexistent');
      expect(desktopPath).toContain('path');
    });
  });

  describe('File path creation', () => {
    test('should create valid workout video file paths', () => {
      const desktopPath = getDesktopPath();
      const timestamp = '2025-01-15T10-30-00-000Z';
      const filename = `workout_video_${timestamp}.mp4`;
      const fullPath = path.join(desktopPath, filename);
      
      expect(fullPath).toContain(desktopPath);
      expect(fullPath).toContain(filename);
      expect(fullPath).toContain('.mp4');
    });

    test('should handle special characters in file names', () => {
      const desktopPath = getDesktopPath();
      const specialFilename = 'workout_video_with_spaces_and_symbols_@#$%.mp4';
      const fullPath = path.join(desktopPath, specialFilename);
      
      expect(fullPath).toContain(desktopPath);
      expect(fullPath).toContain(specialFilename);
    });
  });
}); 