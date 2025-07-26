# Test Suite

This directory contains all the Jest test files for the Wurqit application.

## Test Files

- **`test-generator.test.js`** - Tests basic generator utility functions
- **`test-form.test.js`** - Tests form data handling and validation
- **`test-progress.test.js`** - Tests progress callback functionality
- **`test-desktop-path.test.js`** - Tests desktop path resolution
- **`test-cross-platform.test.js`** - Tests cross-platform compatibility

## Running Tests

### Run All Tests
```bash
yarn test
```

### Run Tests in Watch Mode
```bash
yarn test:watch
```

### Run Tests with Coverage
```bash
yarn test -- --coverage
```

### Run Specific Test File
```bash
yarn test -- test-generator.test.js
```

### Run Tests from Parent Directory
```bash
# From project root
yarn test
```

## Test Descriptions

### test-generator.test.js
Tests the core utility functions:
- `validateNumber()` - Number validation with boundary testing
- `formatExerciseName()` - Exercise name formatting for various file types
- `checkFfmpeg()` - FFmpeg availability check
- `getCategories()` - Category loading and validation
- `getEquipment()` - Equipment loading and validation
- `selectExercisesEvenly()` - Exercise selection algorithm
- Print functions existence and structure

### test-form.test.js
Tests form functionality:
- Category and equipment loading with validation
- Form data structure validation
- Input validation functions with boundary testing
- Form field type checking
- Validation range testing

### test-progress.test.js
Tests progress tracking:
- Progress callback functionality with proper structure
- Real-time progress updates with validation
- Progress message content validation
- Error handling for progress callbacks
- Null callback handling
- Progress percentage validation (0-100%)

### test-desktop-path.test.js
Tests desktop path resolution:
- Desktop path detection for current OS
- Write permission verification
- Output file path creation
- Cross-platform path handling
- Error handling for invalid paths
- File system operations testing

### test-cross-platform.test.js
Tests cross-platform compatibility:
- Path resolution for Windows, macOS, and Linux
- Path separator handling
- International desktop folder names
- Platform detection and validation
- File path creation across platforms
- Special character handling in paths

## Jest Configuration

The tests use Jest with the following configuration (`jest.config.js`):
- Node.js test environment
- Coverage reporting enabled
- 30-second timeout for video generation tests
- Verbose output for better debugging
- Coverage reports in text, lcov, and HTML formats

## Requirements

- Node.js installed
- Jest testing framework (installed as dev dependency)
- FFmpeg available (via ffmpeg-static)
- Videos directory with exercise videos
- Proper file permissions for desktop access

## Test Structure

All tests follow Jest conventions:
- `describe()` blocks for grouping related tests
- `test()` or `it()` for individual test cases
- `beforeEach()` and `afterEach()` for setup/teardown
- Proper mocking of external dependencies
- Comprehensive assertions using Jest matchers

## Coverage

Tests provide comprehensive coverage of:
- Utility functions
- Form validation
- Progress tracking
- File system operations
- Cross-platform compatibility
- Error handling scenarios

## Notes

- Tests require the `../generator.js` module to be available
- Some tests may create temporary files or directories
- Progress tests may take several minutes to complete
- Desktop path tests require write access to the desktop directory
- Video generation tests are skipped if FFmpeg is not available
- All tests include proper cleanup to avoid leaving test artifacts 