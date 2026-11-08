#!/bin/bash
# Mindly for macOS: double-click (first time: right-click > Open).
cd "$(dirname "$0")" || exit 1
mkdir -p projects
V=45.2.3
if [ "$(sysctl -n hw.optional.arm64 2>/dev/null)" = "1" ]; then
  A=arm64; SUM=4d7c429064087a47b855d9bd06c76ead4819b7f02b385de232d4a5c37ecef55f
else
  A=x64;   SUM=d87323533cc8750ef177e5b48058f7a8b381f677d4e103cc63360006c08829c2
fi
R="runtime/mac-$A"
APP="$R/Electron.app"
# the folder may come from the Internet: remove the quarantine flag so Mindly can start and save next to itself
xattr -dr com.apple.quarantine "$PWD" 2>/dev/null

fail() { echo; echo " [Mindly] $1"; read -r -p " Press Enter to close..." _; exit 1; }

# Give the app its own name and logo (Dock, menu bar, app switcher): "Mindly" instead of "Electron".
brand() {
  [ -f "$R/.branded" ] && return 0
  PL="$APP/Contents/Info.plist"; IC="$APP/Contents/Resources/electron.icns"
  cp "$PL" "$PL.orig"; cp "$IC" "$IC.orig"
  PB=/usr/libexec/PlistBuddy
  { "$PB" -c "Set :CFBundleName Mindly" "$PL" && \
    { "$PB" -c "Set :CFBundleDisplayName Mindly" "$PL" 2>/dev/null || "$PB" -c "Add :CFBundleDisplayName string Mindly" "$PL"; } && \
    cp static/icon.icns "$IC" && \
    codesign --force --deep --sign - "$APP" >/dev/null 2>&1; } \
  && touch "$R/.branded" \
  || { cp "$PL.orig" "$PL"; cp "$IC.orig" "$IC"; codesign --force --deep --sign - "$APP" >/dev/null 2>&1; }
  rm -f "$PL.orig" "$IC.orig"
}

if [ ! -x "$APP/Contents/MacOS/Electron" ]; then
  echo
  echo " ============================================================"
  echo "  Mindly - first start"
  echo "  Downloading the app engine for macOS ($A)."
  echo "  This happens only once: afterwards Mindly works offline."
  echo " ============================================================"
  echo
  T="$(mktemp -t mindly).zip"
  echo "  Downloading... (percentage below)"
  curl -fL -# "https://github.com/electron/electron/releases/download/v$V/electron-v$V-darwin-$A.zip" -o "$T" \
    || { rm -f "$T"; fail "Download failed. Check the Internet connection and try again."; }
  echo "  Verifying..."
  [ "$(shasum -a 256 "$T" | cut -d' ' -f1)" = "$SUM" ] || { rm -f "$T"; fail "The download is corrupted. Try again."; }
  mkdir -p "$R"
  TOTAL=$(unzip -Z1 "$T" | wc -l | tr -d ' ')
  unzip -o "$T" -d "$R" | awk -v t="$TOTAL" '{n++; p=int(n*100/t); if(p>100)p=100; printf "\r  Extracting...   %3d%%", p; fflush()} END{printf "\n"}'
  rm -f "$T"
  # lighter engine: keep only English (done before brand(), which signs the app again)
  find "$APP" -type d -name '*.lproj' ! -name 'en.lproj' -prune -exec rm -rf {} + 2>/dev/null
  xattr -dr com.apple.quarantine "$R" 2>/dev/null
  [ -x "$APP/Contents/MacOS/Electron" ] || fail "Extraction failed."
  echo "  Done. Starting Mindly..."
fi
brand
nohup "$APP/Contents/MacOS/Electron" . >/dev/null 2>&1 &
disown
sleep 1
osascript -e 'tell application "Terminal" to close (every window whose name contains "start-mac")' >/dev/null 2>&1
exit 0
