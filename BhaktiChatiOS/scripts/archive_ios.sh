#!/usr/bin/env bash
set -euo pipefail

# Usage examples:
#   ./scripts/archive_ios.sh --workspace /path/MyApp.xcworkspace --scheme MyApp --configuration Release --team-id ABC1234567 --bundle-id com.example.myapp
#   ./scripts/archive_ios.sh --project /path/MyApp.xcodeproj --scheme MyApp

WORKSPACE=""
PROJECT=""
SCHEME=""
CONFIGURATION="Release"
TEAM_ID=""
BUNDLE_ID=""
EXPORT_METHOD="app-store"
EXPORT_DIR="${PWD}/build/export"
ARCHIVE_PATH="${PWD}/build/BhaktiChat.xcarchive"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace) WORKSPACE="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --scheme) SCHEME="$2"; shift 2 ;;
    --configuration) CONFIGURATION="$2"; shift 2 ;;
    --team-id) TEAM_ID="$2"; shift 2 ;;
    --bundle-id) BUNDLE_ID="$2"; shift 2 ;;
    --export-method) EXPORT_METHOD="$2"; shift 2 ;;
    --export-dir) EXPORT_DIR="$2"; shift 2 ;;
    --archive-path) ARCHIVE_PATH="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$SCHEME" ]]; then
  echo "Missing required --scheme"
  exit 1
fi
if [[ -z "$WORKSPACE" && -z "$PROJECT" ]]; then
  echo "Provide either --workspace or --project"
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_DIR"

EXPORT_PLIST="$(mktemp /tmp/bhaktichat-exportOptions.XXXXXX.plist)"
cat > "$EXPORT_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${EXPORT_METHOD}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
PLIST

if [[ -n "$TEAM_ID" ]]; then
  cat >> "$EXPORT_PLIST" <<PLIST
  <key>teamID</key>
  <string>${TEAM_ID}</string>
PLIST
fi

cat >> "$EXPORT_PLIST" <<'PLIST'
</dict>
</plist>
PLIST

BUILD_TARGET=(xcodebuild)
if [[ -n "$WORKSPACE" ]]; then
  BUILD_TARGET+=( -workspace "$WORKSPACE" )
else
  BUILD_TARGET+=( -project "$PROJECT" )
fi

if [[ -n "$TEAM_ID" ]]; then
  BUILD_TARGET+=( DEVELOPMENT_TEAM="$TEAM_ID" )
fi
if [[ -n "$BUNDLE_ID" ]]; then
  BUILD_TARGET+=( PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" )
fi

echo "[archive] Cleaning"
"${BUILD_TARGET[@]}" -scheme "$SCHEME" -configuration "$CONFIGURATION" -sdk iphoneos clean

echo "[archive] Archiving"
"${BUILD_TARGET[@]}" -scheme "$SCHEME" -configuration "$CONFIGURATION" -sdk iphoneos -archivePath "$ARCHIVE_PATH" archive

echo "[archive] Exporting IPA"
xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" -exportPath "$EXPORT_DIR" -exportOptionsPlist "$EXPORT_PLIST"

echo "[archive] Done. Output in: $EXPORT_DIR"
ls -la "$EXPORT_DIR"
