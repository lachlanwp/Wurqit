const path = require("path");

// Mock modules
jest.mock("fs");
jest.mock("child_process");
jest.mock("ffmpeg-static");
jest.mock("os");

// Import the module under test
const generator = require("../generator");

// Get the mocked modules
const fs = require("fs");
const { spawn } = require("child_process");
const os = require("os");

describe("Generator Module - Simplified Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => true });
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue("mock file content");
    fs.rmSync.mockImplementation(() => {});

    os.platform.mockReturnValue("darwin");
    os.arch.mockReturnValue("x64");
    os.homedir.mockReturnValue("/mock/home");
    os.tmpdir.mockReturnValue("/tmp");

    global.process.mainModule = null;
    global.process.resourcesPath = "/mock/resources/path";
    global.process.cwd.mockReturnValue("/mock/current/directory");
    global.process.memoryUsage.mockReturnValue({
      heapUsed: 100 * 1024 * 1024, // 100MB
    });
  });

  describe("Utility Functions", () => {
    describe("validateNumber", () => {
      test("should validate valid numbers within range", () => {
        expect(generator.validateNumber("10", 5, 20)).toBe(true);
        expect(generator.validateNumber("5", 5, 20)).toBe(true);
        expect(generator.validateNumber("20", 5, 20)).toBe(true);
      });

      test("should reject invalid numbers", () => {
        expect(generator.validateNumber("abc", 5, 20)).toBe(false);
        expect(generator.validateNumber("", 5, 20)).toBe(false);
        expect(generator.validateNumber(null, 5, 20)).toBe(false);
        expect(generator.validateNumber(undefined, 5, 20)).toBe(false);
      });

      test("should reject numbers outside range", () => {
        expect(generator.validateNumber("4", 5, 20)).toBe(false);
        expect(generator.validateNumber("21", 5, 20)).toBe(false);
      });
    });

    describe("formatExerciseName", () => {
      test("should format exercise names correctly", () => {
        expect(generator.formatExerciseName("barbell-squat.mp4")).toBe(
          "Barbell squat"
        );
        expect(generator.formatExerciseName("push-up.mp4")).toBe("Push up");
        expect(generator.formatExerciseName("single-exercise.mp4")).toBe(
          "Single exercise"
        );
      });

      test("should handle files without extension", () => {
        expect(generator.formatExerciseName("barbell-squat")).toBe(
          "Barbell squat"
        );
      });
    });


  });

  describe("FFmpeg Functions", () => {
    describe("getFfmpegPath", () => {
      test("should return ffmpeg-static path in development mode", () => {
        global.process.mainModule = null;

        const result = generator.getFfmpegPath();
        expect(result).toBe("/mock/ffmpeg/path");
      });

      test("should return correct path for production on macOS", () => {
        global.process.mainModule = { filename: "app.asar/main.js" };
        os.platform.mockReturnValue("darwin");
        fs.existsSync.mockReturnValue(true);

        const result = generator.getFfmpegPath();
        expect(result).toContain("ffmpeg");
      });

      test("should return correct path for production on Windows", () => {
        global.process.mainModule = { filename: "app.asar/main.js" };
        os.platform.mockReturnValue("win32");
        fs.existsSync.mockReturnValue(true);

        const result = generator.getFfmpegPath();
        expect(result).toContain("ffmpeg.exe");
      });
    });

    describe("checkFfmpeg", () => {
      test("should throw error if ffmpeg path is not available", () => {
        fs.existsSync.mockReturnValue(false);

        expect(() => generator.checkFfmpeg()).toThrow(
          "FFMPEG executable not found"
        );
      });

      test("should not throw error if ffmpeg is available", () => {
        fs.existsSync.mockReturnValue(true);

        expect(() => generator.checkFfmpeg()).not.toThrow();
      });
    });

    describe("runFfmpeg", () => {
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

      test("should reject when ffmpeg fails", async () => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === "close") {
              callback(1);
            }
          }),
        };
        spawn.mockReturnValue(mockProcess);

        const promise = generator.runFfmpeg(["invalid-args"]);
        await expect(promise).rejects.toThrow("FFmpeg failed with code 1");
      });
    });
  });

  describe("File System Functions", () => {
    describe("getBaseDir", () => {
      test("should return resourcesPath in production mode", () => {
        global.process.mainModule = { filename: "app.asar/main.js" };

        const result = generator.getBaseDir();
        expect(result).toBe("/mock/resources/path");
      });
    });

    describe("getBaseMediaDir", () => {
      test("should return correct media directory path", () => {
        const result = generator.getBaseMediaDir();
        expect(result).toContain("media");
      });
    });

    describe("getVideosDir", () => {
      test("should return correct videos directory path", () => {
        const result = generator.getVideosDir();
        expect(result).toContain("videos");
      });
    });

    describe("getCategories", () => {
      test("should return categories from videos directory", () => {
        fs.readdirSync.mockReturnValue(["strength", "cardio", "stretching"]);
        fs.statSync.mockReturnValue({ isDirectory: () => true });

        const result = generator.getCategories();
        expect(result).toEqual(["strength", "cardio", "stretching"]);
      });

      test("should handle basic category retrieval", () => {
        fs.readdirSync.mockReturnValue(["strength", "cardio", "stretching"]);
        fs.statSync.mockReturnValue({ isDirectory: () => true });

        const result = generator.getCategories();
        expect(result).toEqual(["strength", "cardio", "stretching"]);
      });
    });

    describe("getEquipment", () => {
      test("should return equipment for given categories", () => {
        fs.readdirSync.mockReturnValue(["barbell", "dumbbell", "machine"]);
        fs.statSync.mockReturnValue({ isDirectory: () => true });

        const result = generator.getEquipment(["strength"]);
        expect(result).toEqual(["barbell", "dumbbell", "machine"]);
      });

      test("should return unique equipment across multiple categories", () => {
        fs.readdirSync
          .mockReturnValueOnce(["barbell", "dumbbell"])
          .mockReturnValueOnce(["dumbbell", "machine"]);
        fs.statSync.mockReturnValue({ isDirectory: () => true });

        const result = generator.getEquipment(["strength", "cardio"]);
        expect(result).toEqual(["barbell", "dumbbell", "machine"]);
      });
    });

    describe("getExerciseVideosByEquipment", () => {
      test("should return videos grouped by equipment", () => {
        fs.readdirSync.mockReturnValue(["exercise1.mp4", "exercise2.mp4"]);
        fs.statSync.mockReturnValue({ isDirectory: () => false });

        const result = generator.getExerciseVideosByEquipment(
          ["strength"],
          ["barbell"]
        );
        expect(result).toHaveProperty("barbell");
        expect(Array.isArray(result.barbell)).toBe(true);
      });
    });
  });

  describe("Video Generation Functions", () => {
    describe("createProgressGridOverlay", () => {
      test("should create overlay filter for progress grid", () => {
        const result = generator.createProgressGridOverlay(0, 1, 3, 2);
        expect(typeof result).toBe("string");
        expect(result).toContain("drawbox");
        expect(result).toContain("drawtext");
      });

      test("should handle different grid configurations", () => {
        const result1 = generator.createProgressGridOverlay(1, 2, 5, 3);
        const result2 = generator.createProgressGridOverlay(0, 1, 2, 1);

        expect(result1).not.toBe(result2);
        expect(result1).toContain("drawbox");
        expect(result2).toContain("drawbox");
      });
    });

    describe("createFileList", () => {
      test("should create file list for concatenation", () => {
        const segments = ["/path/to/segment1.mp4", "/path/to/segment2.mp4"];
        const fileList = "/path/to/filelist.txt";

        generator.createFileList(fileList, segments);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          fileList,
          "file '/path/to/segment1.mp4'\nfile '/path/to/segment2.mp4'"
        );
      });
    });
  });

  describe("Video Segment Functions", () => {
    describe("createCountdownSegment", () => {
      test("should create countdown segment successfully", async () => {
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
        fs.existsSync.mockReturnValue(true);

        const result = await generator.createCountdownSegment(
          10,
          "REST",
          "/output.mp4"
        );

        expect(result).toBe(true);
        expect(spawn).toHaveBeenCalled();
      });

      test("should handle ffmpeg failure", async () => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === "close") {
              callback(1);
            }
          }),
        };
        spawn.mockReturnValue(mockProcess);
        fs.existsSync.mockReturnValue(true);

        const result = await generator.createCountdownSegment(
          10,
          "REST",
          "/output.mp4"
        );

        expect(result).toBe(false);
      });
    });

    describe("createExerciseSegment", () => {
      test("should create exercise segment successfully", async () => {
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
        fs.existsSync.mockReturnValue(true);

        const result = await generator.createExerciseSegment(
          "/input.mp4",
          30,
          0,
          1,
          3,
          2,
          "/output.mp4"
        );

        expect(result).toBe(true);
        expect(spawn).toHaveBeenCalled();
      });

      test("should fail if input video does not exist", async () => {
        fs.existsSync.mockReturnValue(false);

        const result = await generator.createExerciseSegment(
          "/nonexistent.mp4",
          30,
          0,
          1,
          3,
          2,
          "/output.mp4"
        );

        expect(result).toBe(false);
      });
    });

    describe("createStationChangeSegment", () => {
      test("should create station change segment successfully", async () => {
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
        fs.existsSync.mockReturnValue(true);

        const result = await generator.createStationChangeSegment(
          15,
          "/next-exercise.mp4",
          "/output.mp4"
        );

        expect(result).toBe(true);
        expect(spawn).toHaveBeenCalled();
      });

      test("should fail if next exercise video does not exist", async () => {
        fs.existsSync.mockReturnValue(false);

        const result = await generator.createStationChangeSegment(
          15,
          "/nonexistent.mp4",
          "/output.mp4"
        );

        expect(result).toBe(false);
      });
    });
  });

  describe("Console Output Functions", () => {
    test("printStatus should log info messages", () => {
      const consoleCallback = jest.fn();

      generator.printStatus("Test message", consoleCallback);

      expect(consoleCallback).toHaveBeenCalledWith("info", "Test message");
    });

    test("printWarning should log warning messages", () => {
      const consoleCallback = jest.fn();

      generator.printWarning("Test warning", consoleCallback);

      expect(consoleCallback).toHaveBeenCalledWith("warn", "Test warning");
    });

    test("printError should log error messages", () => {
      const consoleCallback = jest.fn();

      generator.printError("Test error", consoleCallback);

      expect(consoleCallback).toHaveBeenCalledWith("error", "Test error");
    });
  });

  describe("Parameter Validation", () => {
    test("should validate workout parameters correctly", () => {
      // Test valid parameters
      expect(generator.validateNumber("30", 10, 300)).toBe(true); // workDuration
      expect(generator.validateNumber("10", 5, 120)).toBe(true); // restDuration
      expect(generator.validateNumber("3", 1, 10)).toBe(true); // setsPerStation
      expect(generator.validateNumber("15", 5, 60)).toBe(true); // stationRest
      expect(generator.validateNumber("30", 5, 180)).toBe(true); // totalWorkoutDuration

      // Test invalid parameters
      expect(generator.validateNumber("5", 10, 300)).toBe(false); // workDuration too low
      expect(generator.validateNumber("400", 10, 300)).toBe(false); // workDuration too high
      expect(generator.validateNumber("abc", 10, 300)).toBe(false); // invalid input
    });
  });

  describe("Memory Management", () => {
    test("should not clear caches when memory usage is low", () => {
      // Mock low memory usage
      global.process.memoryUsage.mockReturnValue({
        heapUsed: 100 * 1024 * 1024, // 100MB
      });

      // Mock global.gc
      global.gc = jest.fn();

      // Call a function that might trigger cache clearing
      generator.getCategories();

      // Verify that caches are not cleared
      expect(global.gc).not.toHaveBeenCalled();
    });
  });
});
