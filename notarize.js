const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }
  return await notarize({
    appBundleId: 'com.example.workoutgenerator',
    appPath: `${appOutDir}/Workout Generator.app`,
    appleId: 'APPLE_ID', // TODO: Replace with your Apple ID
    appleIdPassword: 'APPLE_ID_PASSWORD', // TODO: Replace with your app-specific password
  });
}; 