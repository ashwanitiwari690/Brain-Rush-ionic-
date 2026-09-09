import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.log('[prepare-android] Android platform not found; run "npm run cap:add:android" first.');
  process.exit(0);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');
const applicationTag = /<application\b([^>]*)>/s;
const match = manifest.match(applicationTag);

if (!match) {
  throw new Error(`[prepare-android] Could not find <application> in ${manifestPath}`);
}

let attrs = match[1];
if (/\bandroid:allowBackup\s*=/.test(attrs)) {
  attrs = attrs.replace(/\bandroid:allowBackup\s*=\s*"[^"]*"/, 'android:allowBackup="false"');
} else {
  attrs += '\n        android:allowBackup="false"';
}

manifest = manifest.replace(applicationTag, `<application${attrs}>`);
fs.writeFileSync(manifestPath, manifest);
console.log('[prepare-android] Disabled Android backup/restore so uninstall starts a fresh local game wallet. App updates still preserve app data.');

// Regenerate the Android app icon from resources/icon.png on every prepare so a
// designer swapping that file can never leave the native project on a stale icon
// (this previously happened: the shipped APK kept an old icon after icon.png changed).
// The background color matches icon.png's own corner tone so the adaptive-icon
// safe-zone ring blends with the artwork instead of showing a white halo.
const ICON_BACKGROUND_COLOR = '#0f102a';
const capacitorAssetsBin = path.resolve('node_modules/@capacitor/assets/bin/capacitor-assets');
execFileSync(
  process.execPath,
  [capacitorAssetsBin, 'generate', '--android', '--iconBackgroundColor', ICON_BACKGROUND_COLOR, '--iconBackgroundColorDark', ICON_BACKGROUND_COLOR],
  { stdio: 'inherit' }
);
console.log('[prepare-android] Regenerated Android app icon from resources/icon.png.');
