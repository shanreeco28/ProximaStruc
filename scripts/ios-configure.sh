#!/usr/bin/env bash
# Prepares the iOS project for a build on macOS (Codemagic or a Mac).
#  - Writes ios/App/App/GoogleService-Info.plist from $GOOGLE_SERVICE_INFO_PLIST (base64) when set.
#  - Copies its REVERSED_CLIENT_ID into Info.plist so Google sign-in can return to the app.
set -euo pipefail
cd "$(dirname "$0")/.."

PLIST=ios/App/App/GoogleService-Info.plist
INFO=ios/App/App/Info.plist

if [[ -n "${GOOGLE_SERVICE_INFO_PLIST:-}" ]]; then
  echo "$GOOGLE_SERVICE_INFO_PLIST" | base64 --decode > "$PLIST"
fi
if [[ ! -f "$PLIST" ]]; then
  echo "Missing $PLIST. Download it from Firebase Console > Project settings > Your apps (iOS)." >&2
  exit 1
fi

REVERSED_CLIENT_ID=$(/usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PLIST")
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :BUNDLE_ID" "$PLIST")
/usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 $REVERSED_CLIENT_ID" "$INFO"
echo "Google sign-in URL scheme set to $REVERSED_CLIENT_ID (Firebase iOS app: $BUNDLE_ID)"
