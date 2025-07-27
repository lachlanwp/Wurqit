// Mock child_process module
const mockSpawn = jest.fn();

module.exports = {
  spawn: mockSpawn,
};
