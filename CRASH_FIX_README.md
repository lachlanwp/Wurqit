# macOS Crash Fix

## Problem

The app was crashing on macOS with a V8 engine crash during initialization. The crash report showed:

```
Termination Reason: Namespace SIGNAL, Code 5 Trace/BPT trap: 5
```

## Root Causes Identified

1. **Memory Management**: Large video library loading into memory during initialization
2. **Electron Version**: Using Electron 30.0.0 which had compatibility issues
3. **FFmpeg Integration**: Complex path resolution causing memory issues
4. **Missing Crash Prevention**: No error handling for V8 engine crashes

## Fixes Applied

### 1. Memory Management Improvements

- Added memory limits: `--max-old-space-size 4096`
- Implemented lazy loading with caching for video files
- Added automatic cache clearing when memory usage exceeds 500MB
- Disabled GPU sandbox and other memory-intensive features

### 2. Electron Version Downgrade

- Downgraded from Electron 30.0.0 to 28.2.0 (more stable)
- Added crash prevention flags

### 3. Enhanced Error Handling

- Added uncaught exception handlers
- Added renderer process crash recovery
- Improved window lifecycle management

### 4. macOS Entitlements

- Added JIT compilation permissions
- Added dynamic library loading permissions
- Disabled library validation for better compatibility

## Testing the Fix

### 1. Test the App Startup

```bash
yarn test-start
```

This will run a minimal version of the app for 3 seconds to verify it doesn't crash.

### 2. Test the Full App

```bash
yarn start
```

This will run the full app with all features.

### 3. Build and Test

```bash
yarn build
```

Then test the built app from the `dist` folder.

## Key Changes Made

### main.js

- Added memory management command line switches
- Added crash prevention and error handling
- Improved window lifecycle management

### generator.js

- Added caching system for video files
- Implemented lazy loading to prevent memory overload
- Added automatic cache clearing based on memory usage

### package.json

- Downgraded Electron to 28.2.0
- Added test script for crash testing

### Entitlements (info.plist, info.inherit.plist)

- Added JIT compilation permissions
- Added dynamic library loading permissions
- Disabled library validation

## Monitoring

The app now includes memory monitoring and will automatically clear caches when memory usage exceeds 500MB. Check the console logs for memory usage information.

## If Issues Persist

1. Check console logs for memory usage
2. Verify FFmpeg installation in the built app
3. Test with different video categories to isolate memory issues
4. Consider further reducing the video library size or implementing streaming
