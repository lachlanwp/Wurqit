// Mock os module
const mockOs = {
  platform: jest.fn(),
  arch: jest.fn(),
  homedir: jest.fn(),
  tmpdir: jest.fn(),
};

module.exports = mockOs;
