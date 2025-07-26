# Test Suite

This directory contains all the test files for the Wurqit application.

## Test Files

- **`test-generator.js`** - Tests basic generator utility functions
- **`test-form.js`** - Tests form data handling and validation
- **`test-progress.js`** - Tests progress callback functionality
- **`test-desktop-path.js`** - Tests desktop path resolution
- **`test-cross-platform.js`** - Tests cross-platform compatibility

## Running Tests

### Run All Tests
```bash
cd tests
node run-all-tests.js
```

### Run Individual Tests
```bash
cd tests
node test-generator.js
node test-form.js
node test-progress.js
node test-desktop-path.js
node test-cross-platform.js
```

### Run Tests from Parent Directory
```bash
# From desktop-app directory
node tests/test-generator.js
node tests/test-form.js
node tests/test-progress.js
node tests/test-desktop-path.js
node tests/test-cross-platform.js
```

## Test Descriptions

### test-generator.js
Tests the core utility functions:
- `validateNumber()` - Number validation
- `formatExerciseName()` - Exercise name formatting
- `checkFfmpeg()` - FFmpeg availability check
- `getCategories()` - Category loading
- `getEquipment()` - Equipment loading
- `selectExercisesEvenly()` - Exercise selection

### test-form.js
Tests form functionality:
- Category and equipment loading
- Form data structure validation
- Input validation functions

### test-progress.js
Tests progress tracking:
- Progress callback functionality
- Real-time progress updates
- Complete workout video generation with progress

### test-desktop-path.js
Tests desktop path resolution:
- Desktop path detection for current OS
- Write permission verification
- Output file path creation

### test-cross-platform.js
Tests cross-platform compatibility:
- Path resolution for Windows, macOS, and Linux
- Path separator handling
- International desktop folder names

## Requirements

- Node.js installed
- FFmpeg available (via ffmpeg-static)
- Videos directory with exercise videos
- Proper file permissions for desktop access

## Notes

- Tests require the `../generator.js` module to be available
- Some tests may create temporary files or directories
- Progress tests may take several minutes to complete
- Desktop path tests require write access to the desktop directory 