const { getDesktopPath } = require('../generator');
const os = require('os');
const path = require('path');

describe('Cross-Platform Compatibility', () => {
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

  describe('Platform Detection', () => {
    test('should detect current platform correctly', () => {
      const platform = os.platform();
      expect(['win32', 'darwin', 'linux']).toContain(platform);
    });

    test('should have valid home directory', () => {
      const homeDir = os.homedir();
      expect(typeof homeDir).toBe('string');
      expect(homeDir.length).toBeGreaterThan(0);
    });

    test('should detect architecture correctly', () => {
      const arch = os.arch();
      expect(['x64', 'x32', 'arm64', 'arm']).toContain(arch);
    });
  });

  describe('Windows Compatibility', () => {
    test('should handle Windows paths correctly', () => {
      // Mock Windows environment
      os.platform = jest.fn(() => 'win32');
      os.homedir = jest.fn(() => 'C:\\Users\\TestUser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('C:\\Users\\TestUser');
      expect(desktopPath).toContain('Desktop');
      expect(desktopPath).toMatch(/^[A-Z]:\\/); // Windows drive letter
    });

    test('should handle Windows path separators', () => {
      const win32Path = path.win32.join('C:', 'Users', 'TestUser', 'Desktop');
      expect(win32Path).toBe('C:\\Users\\TestUser\\Desktop');
      expect(win32Path).toContain('\\');
    });

    test('should create Windows file paths', () => {
      const timestamp = '2025-01-15T10-30-00-000Z';
      const filename = `workout_video_${timestamp}.mp4`;
      const desktopPath = 'C:\\Users\\TestUser\\Desktop';
      const fullPath = path.win32.join(desktopPath, filename);
      
      expect(fullPath).toBe('C:\\Users\\TestUser\\Desktop\\workout_video_2025-01-15T10-30-00-000Z.mp4');
    });
  });

  describe('macOS Compatibility', () => {
    test('should handle macOS paths correctly', () => {
      // Mock macOS environment
      os.platform = jest.fn(() => 'darwin');
      os.homedir = jest.fn(() => '/Users/testuser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('Users');
      expect(desktopPath).toContain('testuser');
      expect(desktopPath).toContain('Desktop');
    });

    test('should handle POSIX path separators', () => {
      const posixPath = path.posix.join('/Users', 'testuser', 'Desktop');
      expect(posixPath).toBe('/Users/testuser/Desktop');
      expect(posixPath).toContain('/');
    });

    test('should create macOS file paths', () => {
      const timestamp = '2025-01-15T10-30-00-000Z';
      const filename = `workout_video_${timestamp}.mp4`;
      const desktopPath = '/Users/testuser/Desktop';
      const fullPath = path.posix.join(desktopPath, filename);
      
      expect(fullPath).toBe('/Users/testuser/Desktop/workout_video_2025-01-15T10-30-00-000Z.mp4');
    });
  });

  describe('Linux Compatibility', () => {
    test('should handle Linux paths correctly', () => {
      // Mock Linux environment
      os.platform = jest.fn(() => 'linux');
      os.homedir = jest.fn(() => '/home/testuser');
      
      const desktopPath = getDesktopPath();
      expect(desktopPath).toContain('home');
      expect(desktopPath).toContain('testuser');
      expect(desktopPath).toContain('Desktop');
    });

    test('should handle international desktop folder names', () => {
      const internationalNames = [
        'Desktop',
        'Рабочий стол', // Russian
        'Escritorio',   // Spanish
        'Bureau',       // French
        'Schreibtisch'  // German
      ];

      internationalNames.forEach(name => {
        const homeDir = '/home/testuser';
        const desktopPath = path.posix.join(homeDir, name);
        expect(desktopPath).toBe(`/home/testuser/${name}`);
      });
    });

    test('should create Linux file paths', () => {
      const timestamp = '2025-01-15T10-30-00-000Z';
      const filename = `workout_video_${timestamp}.mp4`;
      const desktopPath = '/home/testuser/Desktop';
      const fullPath = path.posix.join(desktopPath, filename);
      
      expect(fullPath).toBe('/home/testuser/Desktop/workout_video_2025-01-15T10-30-00-000Z.mp4');
    });
  });

  describe('Path Separator Handling', () => {
    test('should use correct path separators for current platform', () => {
      const currentSeparator = path.sep;
      const win32Separator = path.win32.sep;
      const posixSeparator = path.posix.sep;
      
      expect(win32Separator).toBe('\\');
      expect(posixSeparator).toBe('/');
      expect([win32Separator, posixSeparator]).toContain(currentSeparator);
    });

    test('should handle path joining correctly', () => {
      const parts = ['home', 'user', 'Desktop'];
      const joinedPath = path.join(...parts);
      
      expect(joinedPath).toContain('home');
      expect(joinedPath).toContain('user');
      expect(joinedPath).toContain('Desktop');
    });
  });

  describe('File Path Examples', () => {
    test('should create consistent file paths across platforms', () => {
      const timestamp = '2025-01-15T10-30-00-000Z';
      const filename = `workout_video_${timestamp}.mp4`;
      
      const platforms = [
        { name: 'Windows', homeDir: 'C:\\Users\\TestUser', desktop: 'C:\\Users\\TestUser\\Desktop' },
        { name: 'macOS', homeDir: '/Users/testuser', desktop: '/Users/testuser/Desktop' },
        { name: 'Linux', homeDir: '/home/testuser', desktop: '/home/testuser/Desktop' }
      ];

      platforms.forEach(platform => {
        const fullPath = path.join(platform.desktop, filename);
        expect(fullPath).toContain(filename);
        expect(fullPath).toContain('.mp4');
        expect(fullPath).toContain('Desktop');
      });
    });

    test('should handle special characters in paths', () => {
      const specialChars = ['@', '#', '$', '%', '&', '*', '(', ')', '[', ']', '{', '}'];
      const timestamp = '2025-01-15T10-30-00-000Z';
      
      specialChars.forEach(char => {
        const filename = `workout_video_${char}_${timestamp}.mp4`;
        const desktopPath = '/home/testuser/Desktop';
        const fullPath = path.join(desktopPath, filename);
        
        expect(fullPath).toContain(filename);
        expect(fullPath).toContain(char);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported platforms gracefully', () => {
      // Mock unsupported platform
      os.platform = jest.fn(() => 'unsupported');
      os.homedir = jest.fn(() => '/home/testuser');
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath).toBe('/home/testuser');
    });

    test('should handle empty home directory', () => {
      // Mock empty home directory
      os.homedir = jest.fn(() => '');
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath).toBe('Desktop');
    });
  });

  describe('Integration Tests', () => {
    test('should work with current platform', () => {
      const currentPlatform = os.platform();
      const homeDir = os.homedir();
      
      expect(['win32', 'darwin', 'linux']).toContain(currentPlatform);
      expect(typeof homeDir).toBe('string');
      expect(homeDir.length).toBeGreaterThan(0);
      
      const desktopPath = getDesktopPath();
      expect(typeof desktopPath).toBe('string');
      expect(desktopPath.length).toBeGreaterThan(0);
      expect(desktopPath).toContain(homeDir);
    });
  });
}); 