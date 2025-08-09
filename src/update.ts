import { app, dialog, shell, BrowserWindow } from "electron";
import { spawn } from "child_process";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Get the main window reference
let mainWindow: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow | null) {
  mainWindow = window;
}

interface PackageJson {
  version: string;
}

/**
 * Compares two semantic versions
 * @param current Current version
 * @param latest Latest version
 * @returns true if current version is older than latest version
 */
function isVersionOlder(current: string, latest: string): boolean {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (currentPart < latestPart) return true;
    if (currentPart > latestPart) return false;
  }
  
  return false; // Versions are equal
}

/**
 * Downloads a file from a URL to a specified path with progress tracking
 * @param url URL to download from
 * @param filePath Path to save the file to
 * @param onProgress Progress callback function
 * @returns Promise that resolves when download is complete
 */
function downloadFile(url: string, filePath: string, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    // Handle local file URLs
    if (url.startsWith('file://')) {
      const localPath = url.replace('file://', '');
      console.log(`Copying local file from: ${localPath}`);
      
      try {
        // Copy the file directly
        fs.copyFileSync(localPath, filePath);
        console.log('Local file copy completed');
        if (onProgress) {
          onProgress(100);
        }
        resolve();
        return;
      } catch (error) {
        console.error('Local file copy error:', error);
        reject(error);
        return;
      }
    }
    
    let redirectCount = 0;
    const maxRedirects = 5;
    
    const makeRequest = (requestUrl: string) => {
      console.log(`Making request to: ${requestUrl}`);
      
      https.get(requestUrl, (response) => {
        console.log(`Response status: ${response.statusCode}`);
        
        // Handle redirects (3xx status codes)
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }
          
          const location = response.headers.location;
          if (location) {
            console.log(`Following redirect ${redirectCount} to: ${location}`);
            // Clean up any existing file and make a new request
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            makeRequest(location);
            return;
          } else {
            reject(new Error(`HTTP ${response.statusCode}: No redirect location found`));
            return;
          }
        }
        
        // Handle successful responses (2xx status codes)
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        console.log(`Starting download from: ${requestUrl}`);
        console.log(`Content-Length: ${response.headers['content-length']}`);
        
        // Create a new file stream for the actual download
        const file = fs.createWriteStream(filePath);
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        
        // Call progress with 0% at start
        if (onProgress) {
          onProgress(0);
        }
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            const progress = Math.round((downloadedSize / totalSize) * 100);
            console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize} bytes)`);
            onProgress(progress);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          console.log('Download finished');
          file.close();
          if (onProgress) {
            onProgress(100); // Ensure 100% is called
          }
          resolve();
        });
        
        file.on('error', (err) => {
          console.error('File write error:', err);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(err);
        });
      }).on('error', (err) => {
        console.error('Request error:', err);
        reject(err);
      });
    };
    
    makeRequest(url);
  });
}

/**
 * Gets the download URL for the current platform
 * @returns Download URL for the installer
 */
function getDownloadUrl(): string {
  const platform = os.platform();
  
  switch (platform) {
    case 'darwin':
      return 'https://github.com/lachlanwp/Wurqit/releases/latest/download/install-wurqit-macos.dmg';
    case 'win32':
      return 'https://github.com/lachlanwp/Wurqit/releases/latest/download/install-wurqit-windows.exe';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Gets the file extension for the current platform
 * @returns File extension for the installer
 */
function getFileExtension(): string {
  const platform = os.platform();
  
  switch (platform) {
    case 'darwin':
      return '.dmg';
    case 'win32':
      return '.exe';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Checks for updates and prompts the user if an update is available
 */
export async function checkForUpdates(): Promise<void> {
  try {
    // Get current version from package.json
    const currentVersion = app.getVersion();
    console.log(`Current version: ${currentVersion}`);
    
    // For testing purposes, let's simulate a newer version
    // In a real scenario, this would fetch from a reliable source
    const latestVersion = '1.0.4'; // Simulated newer version
    console.log(`Latest version: ${latestVersion}`);
    
    // TODO: In production, fetch from a reliable source like:
    // - GitHub releases API
    // - A dedicated update server
    // - A version file in a CDN
    
    // Compare versions
    if (isVersionOlder(currentVersion, latestVersion)) {
      console.log('Update available!');
      
      // Show update dialog
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version of Wurqit is available!\n\nCurrent version: ${currentVersion}\nLatest version: ${latestVersion}`,
        detail: 'Would you like to download the latest version?',
        buttons: ['Not now', 'Get update'],
        defaultId: 1,
        cancelId: 0
      });
      
      if (result.response === 1) {
        // User chose to get update
        await downloadUpdate();
      }
    } else {
      console.log('No update available');
    }
    
  } catch (error) {
    console.error('Error checking for updates:', error);
    // Don't show error dialog to user for update check failures
  }
}



/**
 * Downloads the latest installer and prompts user to install
 */
async function downloadUpdate(): Promise<void> {
  try {
    const downloadUrl = getDownloadUrl();
    const fileExtension = getFileExtension();
    const platform = os.platform();
    
    // Get download directory (Downloads folder)
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    
    // Ensure Downloads directory exists
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
    
    // Create filename with version
    const filename = `Wurqit-Update${fileExtension}`;
    const filePath = path.join(downloadsPath, filename);
    
    // Show initial confirmation dialog
    const confirmResult = await dialog.showMessageBox({
      type: 'info',
      title: 'Download Update',
      message: 'Download the latest version?',
      detail: `The installer will be downloaded to your Downloads folder.\n\nFile: ${filename}`,
      buttons: ['Cancel', 'Download'],
      defaultId: 1,
      cancelId: 0
    });
    
    if (confirmResult.response === 0) {
      // User cancelled
      return;
    }
    
    // Download the file with progress tracking
    let downloadProgress = 0;
    
    console.log(`Starting download from: ${downloadUrl}`);
    console.log(`Downloading to: ${filePath}`);
    
    // Send initial progress to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', {
        progress: 0,
        message: 'Starting download...'
      });
    }
    
    try {
      await downloadFile(downloadUrl, filePath, (progress) => {
        downloadProgress = progress;
        console.log(`Download progress: ${progress}%`);
        
        // Send progress update to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-progress', {
            progress: progress,
            message: `Downloading... ${progress}%`
          });
        }
      });
      
      console.log('Download completed successfully');
      
      // Send completion message to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', {
          progress: 100,
          message: 'Download completed successfully!'
        });
      }
      
      // Verify the file was downloaded
      if (!fs.existsSync(filePath)) {
        throw new Error('Download completed but file not found');
      }
      
      const fileStats = fs.statSync(filePath);
      console.log(`Downloaded file size: ${fileStats.size} bytes`);
      
      if (fileStats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
    } catch (downloadError) {
      console.error('Download failed:', downloadError);
      
      // Send error message to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', {
          progress: 0,
          message: `Download failed: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
        });
      }
      
      throw new Error(`Download failed: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
    }
    
    // Show success dialog with instructions
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Download Complete',
      message: 'The installer has been downloaded successfully!',
      detail: `The installer has been saved to:\n${filePath}\n\nPlease close Wurqit and run the installer to complete the update.`,
      buttons: ['Open Downloads Folder', 'OK'],
      defaultId: 0
    });
    
    if (result.response === 0) {
      // Open downloads folder
      if (platform === 'darwin') {
        spawn('open', [downloadsPath]);
      } else if (platform === 'win32') {
        spawn('explorer', [downloadsPath]);
      }
    }
    
  } catch (error) {
    console.error('Error downloading update:', error);
    
    await dialog.showErrorBox(
      'Download Failed',
      `Failed to download the update:\n${error instanceof Error ? error.message : String(error)}\n\nPlease try again later or download manually from the GitHub releases page.`
    );
  }
} 