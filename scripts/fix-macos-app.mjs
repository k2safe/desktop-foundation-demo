import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const appName = "Desktop Foundation Demo.app";
const appPath = join(process.cwd(), "src-tauri", "target", "release", "bundle", "macos", appName);
const plistPath = join(appPath, "Contents", "Info.plist");

if (process.platform !== "darwin") {
  console.log("Skipping macOS app fix outside darwin.");
  process.exit(0);
}

if (!existsSync(appPath)) {
  throw new Error(`App bundle not found: ${appPath}`);
}

for (const key of ["LSRequiresCarbon", "CSResourcesFileMapped"]) {
  try {
    execFileSync("/usr/libexec/PlistBuddy", ["-c", `Delete :${key}`, plistPath], { stdio: "ignore" });
    console.log(`Removed ${key} from Info.plist.`);
  } catch {
    // The key is absent on some Tauri/macOS versions.
  }
}

execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], { stdio: "inherit" });
execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=4", appPath], { stdio: "inherit" });
console.log(`macOS app bundle is ready: ${appPath}`);
