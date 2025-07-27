// Jest setup file for Wurqit tests

const path = require("path");

// Import the mocked modules
const mockFs = require("./__mocks__/fs");
const mockSpawn = require("./__mocks__/child_process").spawn;
const mockOs = require("./__mocks__/os");

// Setup global mocks
global.fs = mockFs;
global.path = path;
global.os = mockOs;

// Mock process object
global.process = {
  ...process,
  mainModule: null,
  resourcesPath: "/mock/resources/path",
  cwd: jest.fn(() => "/mock/current/directory"),
  memoryUsage: jest.fn(() => ({
    heapUsed: 100 * 1024 * 1024, // 100MB
  })),
};

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup default mock implementations
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup default fs mock implementations
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readdirSync.mockReturnValue([]);
  mockFs.statSync.mockReturnValue({ isDirectory: () => true });
  mockFs.mkdirSync.mockImplementation(() => {});
  mockFs.writeFileSync.mockImplementation(() => {});
  mockFs.readFileSync.mockReturnValue("mock file content");
  mockFs.rmSync.mockImplementation(() => {});

  // Setup default os mock implementations
  mockOs.platform.mockReturnValue("darwin");
  mockOs.arch.mockReturnValue("x64");
  mockOs.homedir.mockReturnValue("/mock/home");
  mockOs.tmpdir.mockReturnValue("/tmp");

  // Setup default process mock
  global.process.mainModule = null;
  global.process.resourcesPath = "/mock/resources/path";
  global.process.cwd.mockReturnValue("/mock/current/directory");
  global.process.memoryUsage.mockReturnValue({
    heapUsed: 100 * 1024 * 1024, // 100MB
  });
});

// Export mocks for use in tests
module.exports = {
  mockFs,
  mockSpawn,
  mockOs,
};
