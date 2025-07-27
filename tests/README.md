# Generator Module Tests

This directory contains comprehensive unit tests for the `generator.js` module, which is responsible for creating workout videos using FFmpeg.

## Test Files

### `generator-simple.test.js` (Recommended)

A simplified test suite that focuses on core functionality with 41 passing tests. This file provides good coverage of the main functions without complex mocking issues.

**Coverage:**

- ✅ Utility Functions (validateNumber, formatExerciseName, getDesktopPath)
- ✅ FFmpeg Functions (getFfmpegPath, checkFfmpeg, runFfmpeg)
- ✅ File System Functions (getBaseDir, getBaseMediaDir, getVideosDir, getCategories, getEquipment, getExerciseVideosByEquipment)
- ✅ Video Generation Functions (createProgressGridOverlay, createFileList)
- ✅ Video Segment Functions (createCountdownSegment, createExerciseSegment, createStationChangeSegment)
- ✅ Console Output Functions (printStatus, printWarning, printError)
- ✅ Parameter Validation
- ✅ Memory Management

### `generator.test.js`

A more comprehensive test suite with 47 tests (41 passing, 6 failing). This file includes additional tests for complex scenarios but has some issues with mocking and caching.

## Test Structure

### Mock Setup

The tests use Jest mocks for the following modules:

- `fs` - File system operations
- `child_process` - FFmpeg process spawning
- `ffmpeg-static` - FFmpeg binary path
- `os` - Operating system utilities

### Test Categories

1. **Utility Functions**

   - Input validation
   - Exercise name formatting
   - Desktop path resolution for different operating systems

2. **FFmpeg Functions**

   - Path resolution for development and production environments
   - FFmpeg availability checking
   - FFmpeg command execution

3. **File System Functions**

   - Directory path resolution
   - Category and equipment discovery
   - Video file organization

4. **Video Generation Functions**

   - Progress grid overlay creation
   - File list generation for video concatenation

5. **Video Segment Functions**

   - Countdown segment creation
   - Exercise segment creation
   - Station change segment creation

6. **Console Output Functions**

   - Status, warning, and error message logging

7. **Parameter Validation**

   - Workout parameter validation

8. **Memory Management**
   - Cache clearing when memory usage is high

## Running Tests

```bash
# Run all tests
yarn test

# Run only the simplified test suite
yarn test tests/generator-simple.test.js

# Run only the comprehensive test suite
yarn test tests/generator.test.js

# Run tests in watch mode
yarn test:watch
```

## Test Coverage

The tests provide good coverage of the generator module's functionality:

- **Statement Coverage**: ~58% (simplified tests) to ~86% (comprehensive tests)
- **Branch Coverage**: ~46% (simplified tests) to ~67% (comprehensive tests)
- **Function Coverage**: ~81% (simplified tests) to ~90% (comprehensive tests)
- **Line Coverage**: ~57% (simplified tests) to ~85% (comprehensive tests)

## Key Testing Patterns

### Mocking External Dependencies

```javascript
jest.mock("fs");
jest.mock("child_process");
jest.mock("ffmpeg-static");
jest.mock("os");
```

### Setting Up Mock Implementations

```javascript
beforeEach(() => {
  jest.clearAllMocks();

  fs.existsSync.mockReturnValue(true);
  fs.readdirSync.mockReturnValue([]);
  // ... other mock setups
});
```

### Testing Async Functions

```javascript
test("should resolve when ffmpeg succeeds", async () => {
  const mockProcess = {
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn((event, callback) => {
      if (event === "close") {
        callback(0);
      }
    }),
  };
  spawn.mockReturnValue(mockProcess);

  const promise = generator.runFfmpeg(["-version"]);
  await expect(promise).resolves.toBe("");
});
```

### Testing Error Conditions

```javascript
test("should throw error if ffmpeg path is not available", () => {
  fs.existsSync.mockReturnValue(false);

  expect(() => generator.checkFfmpeg()).toThrow("FFMPEG executable not found");
});
```

## Known Issues

1. **Caching Behavior**: Some tests fail due to the module's internal caching mechanism, which can cause functions to return cached results instead of executing the full logic.

2. **Complex Mocking**: The comprehensive test suite has issues with complex mocking scenarios, particularly around function replacement and cache clearing.

3. **Memory Management**: Testing the cache clearing functionality is challenging due to the need to mock memory usage and garbage collection.

## Recommendations

1. **Use the Simplified Test Suite**: For most development purposes, the `generator-simple.test.js` file provides adequate coverage and is more reliable.

2. **Focus on Core Functionality**: The tests cover the most important aspects of the generator module, including parameter validation, file operations, and video generation.

3. **Maintain Mock Consistency**: When adding new tests, ensure that mocks are properly reset in the `beforeEach` block to avoid test interference.

## Future Improvements

1. **Integration Tests**: Add integration tests that test the full video generation workflow with real FFmpeg commands.

2. **Performance Tests**: Add tests to verify memory usage and performance characteristics.

3. **Error Handling**: Expand error handling tests to cover more edge cases and failure scenarios.

4. **Mock Refactoring**: Improve the mocking strategy to better handle caching and complex function interactions.
