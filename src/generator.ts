import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import ffmpeg from "ffmpeg-static";
import os from "os";

// Add memory management and caching
let categoriesCache: string[] | null = null;
let equipmentCache = new Map<string, string[]>();
let videoFilesCache = new Map<string, { [key: string]: string[] }>();

// Function to clear caches when memory usage is high
function clearCachesIfNeeded(): void {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

  if (heapUsedMB > 500) {
    // Clear caches if heap usage > 500MB
    console.log(
      `[DEBUG] High memory usage (${heapUsedMB.toFixed(2)}MB), clearing caches`
    );
    categoriesCache = null;
    equipmentCache.clear();
    videoFilesCache.clear();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

// Function to get the correct FFmpeg path for both dev and production
function getFfmpegPath(): string {
  // In development, ffmpeg-static returns the path directly
  if (
    !process.mainModule ||
    process.mainModule.filename.indexOf("app.asar") === -1
  ) {
    console.log(
      `[DEBUG] Development mode - using ffmpeg-static path: ${ffmpeg}`
    );
    return ffmpeg || "";
  }

  // In production (packaged app), we need to look in the unpacked resources
  const platform = os.platform();
  const arch = os.arch();

  console.log(`[DEBUG] Production mode - Platform: ${platform}, Arch: ${arch}`);
  console.log(`[DEBUG] Resources path: ${process.resourcesPath}`);
  console.log(`[DEBUG] Current directory: ${__dirname}`);

  // Determine the correct binary name for the platform
  let binaryName = "ffmpeg";
  if (platform === "win32") {
    binaryName = "ffmpeg.exe";
  } else if (platform === "darwin") {
    binaryName = "ffmpeg";
  } else if (platform === "linux") {
    binaryName = "ffmpeg";
  }

  console.log(`[DEBUG] Looking for binary: ${binaryName}`);

  // Try to find the binary in the unpacked resources
  const possiblePaths = [
    // Only try process.resourcesPath if it exists
    ...(process.resourcesPath
      ? [
          path.join(
            process.resourcesPath,
            "app.asar.unpacked",
            "node_modules",
            "ffmpeg-static",
            binaryName
          ),
          path.join(
            process.resourcesPath,
            "app.asar.unpacked",
            "ffmpeg",
            binaryName
          ),
        ]
      : []),
    path.join(
      __dirname,
      "..",
      "app.asar.unpacked",
      "node_modules",
      "ffmpeg-static",
      binaryName
    ),
    path.join(__dirname, "..", "app.asar.unpacked", "ffmpeg", binaryName),
    // Fallback to the original ffmpeg-static path
    ffmpeg,
  ];

  console.log(`[DEBUG] Checking possible paths:`);
  for (let i = 0; i < possiblePaths.length; i++) {
    const ffmpegPath = possiblePaths[i];
    if (ffmpegPath) {
      const exists = fs.existsSync(ffmpegPath);
      console.log(
        `[DEBUG] ${i + 1}. ${ffmpegPath} - ${exists ? "EXISTS" : "NOT FOUND"}`
      );
      if (exists) {
        console.log(`[DEBUG] Found FFmpeg at: ${ffmpegPath}`);
        return ffmpegPath;
      }
    }
  }

  console.log(
    `[DEBUG] FFmpeg not found in any expected location, using fallback: ${ffmpeg}`
  );
  // If we can't find it, return the original path and let it fail with a better error
  return ffmpeg || "";
}

// Colors for output (for console logging)
const colors = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  NC: "\x1b[0m", // No Color
};

// Function to print colored output
function printStatus(
  message: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): void {
  console.log(`${colors.GREEN}[INFO]${colors.NC} ${message}`);
  if (consoleCallback) {
    consoleCallback("info", message);
  }
}

function printWarning(
  message: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): void {
  console.log(`${colors.YELLOW}[WARNING]${colors.NC} ${message}`);
  if (consoleCallback) {
    consoleCallback("warn", message);
  }
}

function printError(
  message: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): void {
  console.log(`${colors.RED}[ERROR]${colors.NC} ${message}`);
  if (consoleCallback) {
    consoleCallback("error", message);
  }
}

// Function to validate numeric input
function validateNumber(input: any, min: number, max: number): boolean {
  const num = parseInt(input);
  return !isNaN(num) && num >= min && num <= max;
}

// Function to convert filename to readable exercise name
function formatExerciseName(filename: string): string {
  const basename = path.basename(filename, path.extname(filename));
  // Replace hyphens with spaces and capitalize only the first character
  return basename.replace(/-/g, " ").replace(/^./, (str) => str.toUpperCase());
}

// Function to check if FFMPEG is available
function checkFfmpeg(
  consoleCallback: ((level: string, message: string) => void) | null = null
): void {
  const ffmpegPath = getFfmpegPath();

  if (!ffmpegPath) {
    throw new Error(
      "FFMPEG is not available. Please ensure ffmpeg-static is properly installed."
    );
  }

  if (!fs.existsSync(ffmpegPath)) {
    throw new Error(
      `FFMPEG executable not found at: ${ffmpegPath}. Please ensure ffmpeg-static is properly installed and unpacked.`
    );
  }

  printStatus(
    `FFMPEG is available and ready to use at: ${ffmpegPath}`,
    consoleCallback
  );
}

function getBaseDir(): string {
  let baseDir: string;
  try {
    if (
      process.mainModule &&
      process.mainModule.filename &&
      process.mainModule.filename.indexOf("app.asar") !== -1
    ) {
      // Running from asar, use resourcesPath
      baseDir = process.resourcesPath || __dirname;
    } else {
      // Dev mode
      baseDir = process.cwd();
    }
  } catch {
    baseDir = process.cwd();
  }
  return baseDir;
}

function getBaseMediaDir(): string {
  let baseDir: string;
  try {
    if (
      process.mainModule &&
      process.mainModule.filename.indexOf("app.asar") !== -1
    ) {
      // Running from asar, use resourcesPath
      baseDir = path.join(getBaseDir(), "app.asar.unpacked", "media");
    } else {
      // Dev mode
      baseDir = path.join(getBaseDir(), "media");
    }
  } catch {
    baseDir = path.join(getBaseDir(), "media");
  }
  return baseDir;
}

function getVideosDir(): string {
  let baseDir: string;
  try {
    if (
      process.mainModule &&
      process.mainModule.filename.indexOf("app.asar") !== -1
    ) {
      // Running from asar, use resourcesPath
      baseDir = path.join(getBaseMediaDir(), "videos");
    } else {
      // Dev mode
      baseDir = path.join(getBaseMediaDir(), "videos");
    }
  } catch {
    baseDir = path.join(getBaseMediaDir(), "videos");
  }
  return baseDir;
}

// Function to get all category names (subfolders in videos/)
function getCategories(): string[] {
  // Check cache first
  if (categoriesCache) {
    return categoriesCache;
  }

  // Clear caches if memory usage is high
  clearCachesIfNeeded();

  const videosDir = getVideosDir();

  if (!fs.existsSync(videosDir)) {
    throw new Error(`Videos directory not found: ${videosDir}`);
  }

  const categories: string[] = [];
  const items = fs.readdirSync(videosDir);

  for (const item of items) {
    const itemPath = path.join(videosDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      categories.push(item);
    }
  }

  // Cache the result
  categoriesCache = categories;
  return categories;
}

// Function to get all equipment names for given categories
function getEquipment(categories: string[]): string[] {
  // Create cache key from categories
  const cacheKey = categories.sort().join(",");

  // Check cache first
  if (equipmentCache.has(cacheKey)) {
    return equipmentCache.get(cacheKey)!;
  }

  // Clear caches if memory usage is high
  clearCachesIfNeeded();

  const videosDir = getVideosDir();
  const equipmentSet = new Set<string>();

  for (const category of categories) {
    const categoryDir = path.join(videosDir, category);
    if (fs.existsSync(categoryDir)) {
      try {
        const items = fs.readdirSync(categoryDir);
        for (const item of items) {
          try {
            const itemPath = path.join(categoryDir, item);
            if (fs.statSync(itemPath).isDirectory()) {
              equipmentSet.add(item);
            }
          } catch (error) {
            // Skip items that can't be stat'd
            const itemPath = path.join(categoryDir, item);
            console.warn(
              `Could not stat ${itemPath}: ${(error as Error).message}`
            );
          }
        }
      } catch (error) {
        // Skip categories that can't be read
        console.warn(
          `Could not read directory ${categoryDir}: ${(error as Error).message}`
        );
      }
    }
  }

  const equipment = Array.from(equipmentSet);

  // Cache the result
  equipmentCache.set(cacheKey, equipment);
  return equipment;
}

// Function to get exercise videos grouped by equipment type
function getExerciseVideosByEquipment(
  categories: string[],
  equipment: string[]
): { [key: string]: string[] } {
  // Create cache key from categories and equipment
  const cacheKey = `${categories.sort().join(",")}|${equipment
    .sort()
    .join(",")}`;

  // Check cache first
  if (videoFilesCache.has(cacheKey)) {
    return videoFilesCache.get(cacheKey)!;
  }

  // Clear caches if memory usage is high
  clearCachesIfNeeded();

  const videosDir = getVideosDir();
  const equipmentVideos: { [key: string]: string[] } = {};

  for (const equip of equipment) {
    equipmentVideos[equip] = [];

    for (const category of categories) {
      const equipDir = path.join(videosDir, category, equip);
      if (fs.existsSync(equipDir)) {
        try {
          const items = fs.readdirSync(equipDir);
          for (const item of items) {
            if (item.toLowerCase().endsWith(".mp4")) {
              equipmentVideos[equip].push(path.join(equipDir, item));
            }
          }
        } catch (error) {
          // Skip equipment directories that can't be read
          console.warn(
            `Could not read directory ${equipDir}: ${(error as Error).message}`
          );
        }
      }
    }
  }

  // Cache the result
  videoFilesCache.set(cacheKey, equipmentVideos);
  return equipmentVideos;
}

// Function to run FFmpeg command and return a promise
function runFfmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();
    const ffmpegProcess = spawn(ffmpegPath, args);

    let stdout = "";
    let stderr = "";

    ffmpegProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    ffmpegProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    ffmpegProcess.on("close", (code: number) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpegProcess.on("error", (error: Error) => {
      reject(error);
    });
  });
}

// Function to create progress grid visualization using colored rectangles
function createProgressGridOverlay(
  currentStation: number,
  currentSet: number,
  totalStations: number,
  setsPerStation: number
): string {
  const videoWidth = 1920;
  const videoHeight = 1080;
  const gridTopMargin = 50;

  // Cell dimensions (matching PNG images)
  const cellWidth = 20;
  const cellHeight = 40;
  const cellMargin = 2; // 2px margin between cells in a station
  const stationMargin = 20; // 20px margin between stations

  // Calculate total grid width
  const totalGridWidth =
    totalStations * setsPerStation * cellWidth +
    (totalStations - 1) * stationMargin +
    totalStations * (setsPerStation - 1) * cellMargin;

  // Calculate starting X position to center the grid
  const gridStartX = Math.floor((videoWidth - totalGridWidth) / 2);

  const filterParts: string[] = [];

  // Add black transparent background behind the entire progress grid
  const gridHeight = cellHeight; // Single row height
  const gridPadding = 10; // Padding around the grid
  filterParts.push(
    `drawbox=x=${gridStartX - gridPadding}:y=${gridTopMargin - gridPadding}:w=${
      totalGridWidth + 2 * gridPadding
    }:h=${gridHeight + 2 * gridPadding}:color=black@0.5:t=fill`
  );

  let currentX = gridStartX;

  for (let station = 0; station < totalStations; station++) {
    for (let set = 1; set <= setsPerStation; set++) {
      // Determine cell color based on status
      let cellColor: string;
      if (
        station < currentStation ||
        (station === currentStation && set < currentSet)
      ) {
        // Completed set - use a sporty lime green color to represent "full"
        cellColor = "lime";
      } else {
        // Not yet completed set - use a lighter color to represent "empty"
        cellColor = "gray";
      }

      // Draw cell rectangle
      filterParts.push(
        `drawbox=x=${currentX}:y=${gridTopMargin}:w=${cellWidth}:h=${cellHeight}:color=${cellColor}:t=fill`
      );

      // Move to next cell position
      currentX += cellWidth + cellMargin;
    }

    // Add station margin (except after last station)
    if (station < totalStations - 1) {
      currentX += stationMargin - cellMargin; // Subtract cellMargin since we already added it
    }
  }

  return filterParts.join(",");
}

// Function to create countdown video segment
async function createCountdownSegment(
  duration: number,
  text: string,
  outputFile: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): Promise<boolean> {
  printStatus(
    `Creating countdown segment: ${text} (${duration}s)`,
    consoleCallback
  );

  // Check if BEEP.mp3 exists
  const beepFile = path.join(getBaseMediaDir(), "audio", "BEEP.mp3");

  // Get Oswald font path
  const oswaldFontPath = path.join(getBaseMediaDir(), "images", "Oswald.ttf");

  // Check if font file exists
  if (!fs.existsSync(oswaldFontPath)) {
    throw new Error(`Oswald font not found: ${oswaldFontPath}`);
  }

  // Choose background color based on text
  let bgColor = "black";
  if (text === "REST") {
    bgColor = "darkred";
  } else if (text === "NEXT EXERCISE") {
    bgColor = "darkblue";
  }

  // Create countdown video with text overlay and beep sound
  const args = [
    "-f",
    "lavfi",
    "-i",
    `color=c=${bgColor}:size=1920x1080:duration=${duration}`,
    ...(fs.existsSync(beepFile) ? ["-i", beepFile] : []),
    "-filter_complex",
    `[0:v]drawtext=text='${text}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=text='%{eif\\:(${duration}-t)\\:d\\:2}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2+100[v]${
      fs.existsSync(beepFile) ? ";[1:a]adelay=0|0[beep]" : ""
    }`,
    "-map",
    "[v]",
    ...(fs.existsSync(beepFile) ? ["-map", "[beep]"] : ["-an"]),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-y",
    outputFile,
  ];

  try {
    await runFfmpeg(args);

    if (!fs.existsSync(outputFile)) {
      throw new Error(`Countdown segment file not created: ${outputFile}`);
    }

    printStatus(`Countdown segment created: ${outputFile}`, consoleCallback);
    return true;
  } catch (error) {
    printError(
      `Failed to create countdown segment: ${outputFile}`,
      consoleCallback
    );
    printError((error as Error).message, consoleCallback);
    return false;
  }
}

// Function to create exercise video segment
async function createExerciseSegment(
  videoFile: string,
  duration: number,
  currentStation: number,
  currentSet: number,
  totalStations: number,
  setsPerStation: number,
  outputFile: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): Promise<boolean> {
  printStatus(
    `Creating exercise segment: ${path.basename(videoFile)} (Station ${
      currentStation + 1
    }, Set ${currentSet})`,
    consoleCallback
  );

  // Check if video file exists
  if (!fs.existsSync(videoFile)) {
    printError(`Video file not found: ${videoFile}`, consoleCallback);
    return false;
  }

  // Get exercise name for display
  const exerciseName = formatExerciseName(videoFile);

  // Check if BEEP.mp3 exists
  const beepFile = path.join(getBaseMediaDir(), "audio", "BEEP.mp3");

  // Create progress grid overlay filter
  const gridOverlay = createProgressGridOverlay(
    currentStation,
    currentSet,
    totalStations,
    setsPerStation
  );

  // Get Oswald font path
  const oswaldFontPath = path.join(getBaseMediaDir(), "images", "Oswald.ttf");

  // Check if font file exists
  if (!fs.existsSync(oswaldFontPath)) {
    throw new Error(`Oswald font not found: ${oswaldFontPath}`);
  }

  // Create exercise video with looped video, exercise name, progress grid, countdown, and beep sound
  const args = [
    "-stream_loop",
    "-1",
    "-t",
    duration.toString(),
    "-i",
    videoFile,
    "-f",
    "lavfi",
    "-i",
    `color=c=darkgreen:size=1920x1080:duration=${duration}`,
    ...(fs.existsSync(beepFile) ? ["-i", beepFile] : []),
    "-filter_complex",
    `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[scaled];[1:v][scaled]overlay=(W-w)/2:(H-h)/2,drawtext=text='${exerciseName}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=h-200:box=1:boxcolor=black@0.7:boxborderw=5,drawtext=text='%{eif\\:(${duration}-t)\\:d\\:2}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=h-100:box=1:boxcolor=black@0.7:boxborderw=5,${gridOverlay}[v]${
      fs.existsSync(beepFile) ? ";[2:a]adelay=0|0[beep]" : ""
    }`,
    "-map",
    "[v]",
    ...(fs.existsSync(beepFile) ? ["-map", "[beep]"] : ["-an"]),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-y",
    outputFile,
  ];

  try {
    await runFfmpeg(args);

    if (!fs.existsSync(outputFile)) {
      throw new Error(`Exercise segment file not created: ${outputFile}`);
    }

    printStatus(`Exercise segment created: ${outputFile}`, consoleCallback);
    return true;
  } catch (error) {
    printError(
      `Failed to create exercise segment: ${outputFile}`,
      consoleCallback
    );
    printError((error as Error).message, consoleCallback);
    return false;
  }
}

// Function to create station change segment with next exercise preview
async function createStationChangeSegment(
  duration: number,
  nextExerciseFile: string,
  outputFile: string,
  consoleCallback: ((level: string, message: string) => void) | null = null
): Promise<boolean> {
  printStatus(
    `Creating station change segment with preview: ${path.basename(
      nextExerciseFile
    )} (${duration}s)`,
    consoleCallback
  );

  // Check if video file exists
  if (!fs.existsSync(nextExerciseFile)) {
    printError(
      `Next exercise video not found: ${nextExerciseFile}`,
      consoleCallback
    );
    return false;
  }

  // Get next exercise name for display
  const nextExerciseName = formatExerciseName(nextExerciseFile);

  // Check if BEEP.mp3 exists
  const beepFile = path.join(getBaseMediaDir(), "audio", "BEEP.mp3");

  // Get Oswald font path
  const oswaldFontPath = path.join(getBaseMediaDir(), "images", "Oswald.ttf");

  // Check if font file exists
  if (!fs.existsSync(oswaldFontPath)) {
    throw new Error(`Oswald font not found: ${oswaldFontPath}`);
  }

  // Create station change video with preview of next exercise
  const args = [
    "-stream_loop",
    "-1",
    "-t",
    duration.toString(),
    "-i",
    nextExerciseFile,
    "-f",
    "lavfi",
    "-i",
    `color=c=black:size=1920x1080:duration=${duration}`,
    ...(fs.existsSync(beepFile) ? ["-i", beepFile] : []),
    "-filter_complex",
    `[0:v]scale=600:600:force_original_aspect_ratio=decrease,pad=600:600:(ow-iw)/2:(oh-ih)/2[scaled];[1:v][scaled]overlay=(W-w)/2:(H-h)/2,drawtext=text='NEXT EXERCISE':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=50,drawtext=text='${nextExerciseName}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=150,drawtext=text='%{eif\\:(${duration}-t)\\:d\\:2}':fontfile='${oswaldFontPath.replace(
      /\\/g,
      "/"
    )}':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=h-100[v]${
      fs.existsSync(beepFile) ? ";[2:a]adelay=0|0[beep]" : ""
    }`,
    "-map",
    "[v]",
    ...(fs.existsSync(beepFile) ? ["-map", "[beep]"] : ["-an"]),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-y",
    outputFile,
  ];

  try {
    await runFfmpeg(args);

    if (!fs.existsSync(outputFile)) {
      throw new Error(`Station change segment file not created: ${outputFile}`);
    }

    printStatus(
      `Station change segment created: ${outputFile}`,
      consoleCallback
    );
    return true;
  } catch (error) {
    printError(
      `Failed to create station change segment: ${outputFile}`,
      consoleCallback
    );
    printError((error as Error).message, consoleCallback);
    return false;
  }
}

// Function to get celebration video files
function getCelebrationVideos(
  consoleCallback: ((level: string, message: string) => void) | null = null
): string[] {
  const celebrateDir = path.join(getBaseMediaDir(), "celebrate");
  printStatus(
    `Looking for celebration directory: ${celebrateDir}`,
    consoleCallback
  );

  let celebrateFiles: string[] = [];

  // Try to get celebration video files
  if (fs.existsSync(celebrateDir)) {
    try {
      const items = fs.readdirSync(celebrateDir);
      for (const item of items) {
        if (item.toLowerCase().endsWith(".mp4")) {
          celebrateFiles.push(path.join(celebrateDir, item));
        }
      }

      if (celebrateFiles.length > 0) {
        printStatus(
          `Found ${celebrateFiles.length} celebration videos:`,
          consoleCallback
        );
        celebrateFiles.forEach((file) => {
          printStatus(`  - ${path.basename(file)}`, consoleCallback);
        });
      }
    } catch (error) {
      printWarning(
        `Could not read celebration directory: ${(error as Error).message}`,
        consoleCallback
      );
    }
  }

  return celebrateFiles;
}

// Function to create file list for concatenation
function createFileList(fileList: string, segments: string[]): void {
  const content = segments.map((segment) => `file '${segment}'`).join("\n");
  fs.writeFileSync(fileList, content);
}

// Function to select exercises with even distribution across equipment types
function selectExercisesEvenly(
  maxExercises: number,
  selectedCategories: string[],
  selectedEquipment: string[],
  consoleCallback: ((level: string, message: string) => void) | null = null
): string[] {
  const equipmentVideos = getExerciseVideosByEquipment(
    selectedCategories,
    selectedEquipment
  );

  // Calculate exercises per equipment type
  const exercisesPerEquipment = Math.floor(
    maxExercises / selectedEquipment.length
  );
  const remainingExercises = maxExercises % selectedEquipment.length;

  // Output debug info
  if (consoleCallback) {
    consoleCallback(
      "info",
      `Distributing ${maxExercises} exercises across ${selectedEquipment.length} equipment types`
    );
    consoleCallback(
      "info",
      `Base exercises per equipment: ${exercisesPerEquipment}`
    );
    if (remainingExercises > 0) {
      consoleCallback(
        "info",
        `Extra exercises to distribute: ${remainingExercises}`
      );
    }
  }

  const selectedExercises: string[] = [];

  // Select exercises from each equipment type
  for (let i = 0; i < selectedEquipment.length; i++) {
    const equip = selectedEquipment[i];
    const videosForEquip = equipmentVideos[equip] || [];

    if (videosForEquip.length === 0) {
      printWarning(`No videos found for equipment: ${equip}`, consoleCallback);
      continue;
    }

    // Calculate how many exercises to select from this equipment
    let exercisesToSelect = exercisesPerEquipment;
    if (i < remainingExercises) {
      exercisesToSelect++;
    }

    // Shuffle videos for this equipment
    const shuffledVideos = [...videosForEquip];
    for (let j = shuffledVideos.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffledVideos[j], shuffledVideos[k]] = [
        shuffledVideos[k],
        shuffledVideos[j],
      ];
    }

    // Select exercises from this equipment
    let selectedFromEquip = 0;
    for (const video of shuffledVideos) {
      if (selectedFromEquip < exercisesToSelect && video) {
        selectedExercises.push(video);
        selectedFromEquip++;
      }
    }

    if (consoleCallback) {
      consoleCallback(
        "info",
        `Selected ${selectedFromEquip} exercises from '${equip}'`
      );
    }
  }

  // Shuffle the final selection to randomize the order
  for (let i = selectedExercises.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedExercises[i], selectedExercises[j]] = [
      selectedExercises[j],
      selectedExercises[i],
    ];
  }

  return selectedExercises;
}

// Main function to generate workout video
async function generateWorkoutVideo(
  workDuration: number,
  restDuration: number,
  setsPerStation: number,
  stationRest: number,
  totalWorkoutDuration: number,
  categories: string[],
  equipment: string[],
  outputPath: string | null = null,
  progressCallback: ((progress: number, message: string) => void) | null = null,
  consoleCallback: ((level: string, message: string) => void) | null = null
): Promise<string> {
  // Helper function to log to both console and browser
  const logToBoth = (message: string) => {
    console.log(message);
    if (consoleCallback) {
      consoleCallback("info", message.replace(/\x1b\[[0-9;]*m/g, "")); // Remove ANSI color codes
    }
  };

  logToBoth(`${colors.BLUE}================================${colors.NC}`);
  logToBoth(`${colors.BLUE}             Wurqit             ${colors.NC}`);
  logToBoth(`${colors.BLUE}================================${colors.NC}`);
  logToBoth("");

  try {
    // Check FFMPEG installation
    checkFfmpeg(consoleCallback);

    // Update progress
    if (progressCallback) {
      progressCallback(5, "Checking FFmpeg installation...");
    }

    // Validate inputs
    if (!validateNumber(workDuration, 10, 300)) {
      throw new Error(
        "Invalid work duration. Please enter a number between 10 and 300 seconds."
      );
    }

    if (!validateNumber(restDuration, 5, 120)) {
      throw new Error(
        "Invalid rest duration. Please enter a number between 5 and 120 seconds."
      );
    }

    if (!validateNumber(setsPerStation, 1, 10)) {
      throw new Error(
        "Invalid sets per station. Please enter a number between 1 and 10."
      );
    }

    if (!validateNumber(stationRest, 5, 60)) {
      throw new Error(
        "Invalid station rest time. Please enter a number between 5 and 60 seconds."
      );
    }

    if (!validateNumber(totalWorkoutDuration, 5, 180)) {
      throw new Error(
        "Invalid total workout duration. Please enter a number between 5 and 180 minutes."
      );
    }

    printStatus("Parameters set:", consoleCallback);
    logToBoth(`  Work duration: ${workDuration}s`);
    logToBoth(`  Rest duration: ${restDuration}s`);
    logToBoth(`  Sets per station: ${setsPerStation}`);
    logToBoth(`  Station rest time: ${stationRest}s`);
    logToBoth(`  Total workout duration: ${totalWorkoutDuration} minutes`);
    logToBoth("");

    // Update progress
    if (progressCallback) {
      progressCallback(10, "Validating parameters...");
    }

    // Calculate how many exercises we can fit in the total workout time
    const totalSeconds = totalWorkoutDuration * 60;
    const timePerExercise =
      workDuration * setsPerStation +
      restDuration * (setsPerStation - 1) +
      stationRest;
    const maxExercises = Math.floor(totalSeconds / timePerExercise);

    if (maxExercises < 1) {
      throw new Error(
        `Workout parameters result in no exercises fitting in ${totalWorkoutDuration} minutes. Try reducing work duration, rest duration, or sets per station.`
      );
    }

    // Update progress
    if (progressCallback) {
      progressCallback(15, "Selecting exercises...");
    }

    // Select exercises with even distribution across equipment types
    printStatus(
      "Selecting exercises with even distribution across equipment types...",
      consoleCallback
    );
    const exerciseVideos = selectExercisesEvenly(
      maxExercises,
      categories,
      equipment,
      consoleCallback
    );

    if (exerciseVideos.length === 0) {
      throw new Error("No exercise videos found or selected!");
    }

    printStatus(
      `Selected ${exerciseVideos.length} exercises for ${totalWorkoutDuration} minute workout.`,
      consoleCallback
    );

    // Calculate total workout time
    const totalSets = setsPerStation * exerciseVideos.length;
    const totalWorkTime = totalSets * workDuration;
    const totalRestTime = totalSets * restDuration;
    const totalStationRest = (exerciseVideos.length - 1) * stationRest;
    const totalTime = totalWorkTime + totalRestTime + totalStationRest;

    printStatus(
      `Estimated total workout time: ${totalTime} seconds (${Math.floor(
        totalTime / 60
      )} minutes)`,
      consoleCallback
    );

    // Update progress
    if (progressCallback) {
      progressCallback(20, "Creating temporary directory...");
    }

    // Create temporary directory for video segments using OS temp dir
    const tempDir = path.join(os.tmpdir(), "workoutgen_temp_" + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    printStatus(`Creating temporary directory: ${tempDir}`, consoleCallback);

    // Update progress
    if (progressCallback) {
      progressCallback(25, "Starting video segment generation...");
    }

    // Generate video segments
    printStatus("Generating video segments...", consoleCallback);
    const segments: string[] = [];
    let segmentCount = 0;

    for (let i = 0; i < exerciseVideos.length; i++) {
      const exerciseName = path.basename(exerciseVideos[i], ".mp4");
      printStatus(`Processing exercise: ${exerciseName}`, consoleCallback);

      // Update progress for each exercise
      if (progressCallback) {
        const exerciseProgress =
          25 + Math.floor((i / exerciseVideos.length) * 60);
        progressCallback(
          exerciseProgress,
          `Processing exercise ${i + 1}/${
            exerciseVideos.length
          }: ${exerciseName}`
        );
      }

      // Create sets for this exercise
      for (let set = 1; set <= setsPerStation; set++) {
        // Work segment
        const workFile = path.join(tempDir, `work_${segmentCount}.mp4`);
        const workSuccess = await createExerciseSegment(
          exerciseVideos[i],
          workDuration,
          i,
          set,
          exerciseVideos.length,
          setsPerStation,
          workFile,
          consoleCallback
        );

        if (!workSuccess) {
          throw new Error(
            `Failed to create work segment for exercise: ${exerciseName}`
          );
        }

        segments.push(workFile);
        segmentCount++;

        // Rest segment (except after last set of last exercise)
        if (set < setsPerStation || i < exerciseVideos.length - 1) {
          const restFile = path.join(tempDir, `rest_${segmentCount}.mp4`);
          const restSuccess = await createCountdownSegment(
            restDuration,
            "REST",
            restFile,
            consoleCallback
          );

          if (!restSuccess) {
            throw new Error("Failed to create rest segment");
          }

          segments.push(restFile);
          segmentCount++;
        }
      }

      // Station rest (except after last exercise)
      if (i < exerciseVideos.length - 1) {
        const stationRestFile = path.join(
          tempDir,
          `station_rest_${segmentCount}.mp4`
        );
        const nextExercise = exerciseVideos[i + 1];
        const stationRestSuccess = await createStationChangeSegment(
          stationRest,
          nextExercise,
          stationRestFile,
          consoleCallback
        );

        if (!stationRestSuccess) {
          throw new Error("Failed to create station change segment");
        }

        segments.push(stationRestFile);
        segmentCount++;
      }
    }

    // Add celebration videos at the end
    printStatus("Adding celebration videos...", consoleCallback);
    const celebrationVideos = getCelebrationVideos(consoleCallback);

    if (celebrationVideos.length > 0) {
      printStatus(
        `Processing ${celebrationVideos.length} celebration videos...`,
        consoleCallback
      );

      // Transcode celebration videos to match workout segment format
      for (let i = 0; i < celebrationVideos.length; i++) {
        const originalVideo = celebrationVideos[i];
        if (fs.existsSync(originalVideo)) {
          const transcodedVideo = path.join(
            tempDir,
            `celebration_${segmentCount}.mp4`
          );

          printStatus(
            `Transcoding celebration video ${i + 1}/${
              celebrationVideos.length
            }: ${path.basename(originalVideo)}`,
            consoleCallback
          );

          try {
            // Get Oswald font path for text overlay
            const oswaldFontPath = path.join(
              getBaseMediaDir(),
              "images",
              "Oswald.ttf"
            );

            // Check if font file exists
            if (!fs.existsSync(oswaldFontPath)) {
              printWarning(
                `Oswald font not found: ${oswaldFontPath}`,
                consoleCallback
              );
              printWarning(
                "Will transcode without text overlay",
                consoleCallback
              );

              // Simple transcoding without text overlay
              const simpleTranscodeArgs = [
                "-i",
                originalVideo,
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "23",
                "-r",
                "25",
                "-c:a",
                "aac",
                "-y",
                transcodedVideo,
              ];

              await runFfmpeg(simpleTranscodeArgs);
            } else {
              printStatus(`Using font: ${oswaldFontPath}`, consoleCallback);

              const transcodeArgs = [
                "-i",
                originalVideo,
                "-filter_complex",
                `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='CONGRATULATIONS!':fontfile='${oswaldFontPath.replace(
                  /\\/g,
                  "/"
                )}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=50:box=1:boxcolor=black@0.7:boxborderw=5,drawtext=text='YOU COMPLETED THE WORKOUT!':fontfile='${oswaldFontPath.replace(
                  /\\/g,
                  "/"
                )}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=150:box=1:boxcolor=black@0.7:boxborderw=5[v]`,
                "-map",
                "[v]",
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "23",
                "-r",
                "25",
                "-an",
                "-y",
                transcodedVideo,
              ];

              await runFfmpeg(transcodeArgs);
            }

            if (fs.existsSync(transcodedVideo)) {
              const stats = fs.statSync(transcodedVideo);
              printStatus(
                `Transcoded file size: ${(stats.size / 1024 / 1024).toFixed(
                  2
                )} MB`,
                consoleCallback
              );

              segments.push(transcodedVideo);
              segmentCount++;
              printStatus(
                `Added transcoded celebration video: ${path.basename(
                  transcodedVideo
                )}`,
                consoleCallback
              );
            } else {
              printWarning(
                `Failed to create transcoded celebration video: ${path.basename(
                  originalVideo
                )}`,
                consoleCallback
              );
            }
          } catch (error) {
            printWarning(
              `Failed to transcode celebration video ${path.basename(
                originalVideo
              )}: ${(error as Error).message}`,
              consoleCallback
            );
          }
        } else {
          printWarning(
            `Celebration video not found: ${originalVideo}`,
            consoleCallback
          );
        }
      }
    } else {
      printStatus(
        "No celebration videos found, skipping celebration",
        consoleCallback
      );
    }

    // Update progress
    if (progressCallback) {
      progressCallback(85, "Creating file list for concatenation...");
    }

    // Create file list for concatenation
    const fileList = path.join(tempDir, "file_list.txt");
    createFileList(fileList, segments);

    // Update progress
    if (progressCallback) {
      progressCallback(90, "Concatenating video segments...");
    }

    // Get output path and create output filename
    if (!outputPath) {
      throw new Error(
        "Output path is required. Please select a folder to save the video."
      );
    }
    const outputDir = outputPath;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(outputDir, `workout_video_${timestamp}.mp4`);

    printStatus(`Output will be saved to: ${outputDir}`, consoleCallback);
    printStatus("Concatenating video segments...", consoleCallback);

    // Show file list for debugging
    printStatus("File list contents:", consoleCallback);
    logToBoth(fs.readFileSync(fileList, "utf8"));

    // Debug: Show segments array and verify each segment
    printStatus(
      `Total segments to concatenate: ${segments.length}`,
      consoleCallback
    );
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const exists = fs.existsSync(segment);
      const segmentName = path.basename(segment);
      printStatus(
        `Segment ${i + 1}: ${segmentName} - ${exists ? "EXISTS" : "MISSING"}`,
        consoleCallback
      );

      if (exists) {
        try {
          // Get segment duration for debugging
          const durationArgs = [
            "-v",
            "quiet",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            segment,
          ];
          const segmentDuration = await runFfmpeg(durationArgs);
          const durationFloat = parseFloat(segmentDuration.trim());
          printStatus(
            `  Duration: ${durationFloat.toFixed(2)}s`,
            consoleCallback
          );
        } catch (durationError) {
          printWarning(
            `  Could not get duration for ${segmentName}: ${
              (durationError as Error).message
            }`,
            consoleCallback
          );
        }
      }
    }

    const concatArgs = [
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      fileList,
      "-c",
      "copy",
      "-avoid_negative_ts",
      "make_zero",
      "-y",
      outputFile,
    ];

    printStatus("Starting video concatenation...", consoleCallback);
    await runFfmpeg(concatArgs);

    if (fs.existsSync(outputFile)) {
      printStatus(
        `Workout video created successfully: ${outputFile}`,
        consoleCallback
      );

      // Update progress
      if (progressCallback) {
        progressCallback(95, "Getting video duration...");
      }

      // Get video duration using ffprobe
      try {
        const durationArgs = [
          "-v",
          "quiet",
          "-show_entries",
          "format=duration",
          "-of",
          "csv=p=0",
          outputFile,
        ];
        const duration = await runFfmpeg(durationArgs);
        if (duration.trim()) {
          printStatus(
            `Video duration: ${duration.trim()} seconds`,
            consoleCallback
          );
        }
      } catch (error) {
        printWarning("Could not determine video duration", consoleCallback);
      }
    } else {
      throw new Error("Failed to create workout video.");
    }

    // Update progress
    if (progressCallback) {
      progressCallback(98, "Cleaning up temporary files...");
    }

    // Clean up temporary files
    printStatus("Cleaning up temporary files...", consoleCallback);
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Update progress
    if (progressCallback) {
      progressCallback(100, "Workout video generation complete!");
    }

    logToBoth("");
    printStatus("Workout video generation complete!", consoleCallback);
    logToBoth(`Output file: ${outputFile}`);

    return outputFile;
  } catch (error) {
    printError((error as Error).message, consoleCallback);
    throw error;
  }
}

export {
  printStatus,
  printWarning,
  printError,
  validateNumber,
  formatExerciseName,
  checkFfmpeg,
  getFfmpegPath,
  getBaseDir,
  getBaseMediaDir,
  getCategories,
  getEquipment,
  getExerciseVideosByEquipment,
  runFfmpeg,
  createProgressGridOverlay,
  createCountdownSegment,
  createExerciseSegment,
  createStationChangeSegment,
  getCelebrationVideos,
  createFileList,
  selectExercisesEvenly,
  generateWorkoutVideo,
  getVideosDir,
};
