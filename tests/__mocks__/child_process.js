// Mock child_process module
const mockSpawn = jest.fn();
const mockExecSync = jest.fn();

module.exports = {
  spawn: mockSpawn,
  execSync: mockExecSync,
};
