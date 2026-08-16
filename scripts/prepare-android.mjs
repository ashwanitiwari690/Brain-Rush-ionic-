import fs from 'node:fs';
import path from 'node:path';

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
