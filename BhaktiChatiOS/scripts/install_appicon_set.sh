#!/usr/bin/env bash
set -euo pipefail

# Copies the prepared AppIcon.appiconset into an Xcode target asset catalog.
# Example:
# ./scripts/install_appicon_set.sh \
#   --source '/Users/anishmadhok/Documents/New project/AppIcon.appiconset' \
#   --target '/path/MyApp/Assets.xcassets/AppIcon.appiconset'

SOURCE="/Users/anishmadhok/Documents/New project/AppIcon.appiconset"
TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="$2"; shift 2 ;;
    --target) TARGET="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Missing --target path (Assets.xcassets/AppIcon.appiconset)"
  exit 1
fi

if [[ ! -d "$SOURCE" ]]; then
  echo "Source appiconset not found: $SOURCE"
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
rm -rf "$TARGET"
cp -R "$SOURCE" "$TARGET"

echo "Installed app icon set to: $TARGET"
