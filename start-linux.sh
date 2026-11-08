#!/bin/sh
# Mindly for Linux: ./start-linux.sh  (or right-click > Run as program)
cd "$(dirname "$0")" || exit 1
HERE="$(pwd)"
mkdir -p projects
V=45.2.3
SUM=a87fe741f6d121285117e574da6c9a2e65210d410123bbc04713b099add0263b

fail() { echo; echo " [Mindly] $1"; exit 1; }

# engines downloaded by an earlier version: give the program its own name
[ -x runtime/linux/electron ] && [ ! -e runtime/linux/Mindly ] && mv runtime/linux/electron runtime/linux/Mindly

if [ ! -x runtime/linux/Mindly ]; then
  echo
  echo " ============================================================"
  echo "  Mindly - first start"
  echo "  Downloading the app engine for Linux."
  echo "  This happens only once: afterwards Mindly works offline."
  echo " ============================================================"
  echo
  U="https://github.com/electron/electron/releases/download/v$V/electron-v$V-linux-x64.zip"
  T="$(mktemp).zip"
  echo "  Downloading... (percentage below)"
  if command -v curl >/dev/null 2>&1; then
    curl -fL -# "$U" -o "$T" || { rm -f "$T"; fail "Download failed. Check the Internet connection and try again."; }
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$T" "$U" 2>&1 | grep --line-buffered -o '[0-9]*%' | while read -r p; do printf '\r  Downloading...  %s   ' "$p"; done; echo
  else fail "Neither curl nor wget is installed."; fi
  echo "  Verifying..."
  [ "$(sha256sum "$T" | cut -d' ' -f1)" = "$SUM" ] || { rm -f "$T"; fail "Download failed or corrupted. Check the Internet connection and try again."; }
  mkdir -p runtime/linux
  if command -v unzip >/dev/null 2>&1; then
    TOTAL=$(unzip -Z1 "$T" | wc -l | tr -d ' ')
    unzip -o "$T" -d runtime/linux | awk -v t="$TOTAL" '{n++; p=int(n*100/t); if(p>100)p=100; printf "\r  Extracting...   %3d%%", p; fflush()} END{printf "\n"}'
  else
    echo "  Extracting..."
    python3 -c "import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$T" runtime/linux || { rm -f "$T"; fail "Extraction failed (install unzip or python3)."; }
  fi
  rm -f "$T"
  # lighter engine: keep only the English language file
  find runtime/linux/locales -name '*.pak' ! -name 'en-US.pak' -delete 2>/dev/null
  rm -f runtime/linux/LICENSES.chromium.html
  mv runtime/linux/electron runtime/linux/Mindly 2>/dev/null   # the program gets its own name: Mindly
  chmod +x runtime/linux/Mindly runtime/linux/chrome_crashpad_handler 2>/dev/null
  [ -x runtime/linux/Mindly ] || fail "Extraction failed."
  echo "  Done. Starting Mindly..."
fi

# Application-menu entry with the Mindly name and logo (also used by the dock / taskbar to show the logo).
# This small file in ~/.local/share/applications is the only thing written outside this folder.
D="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
if mkdir -p "$D" 2>/dev/null; then
  cat > "$D/Mindly.desktop" 2>/dev/null <<DESK
[Desktop Entry]
Type=Application
Name=Mindly
Comment=Mind map editor
Exec="$HERE/start-linux.sh"
Icon=$HERE/static/icon.png
Terminal=false
Categories=Office;Graphics;
StartupWMClass=Mindly
StartupNotify=true
DESK
fi

CHROME_DESKTOP=Mindly.desktop exec runtime/linux/Mindly --no-sandbox --class=Mindly .
