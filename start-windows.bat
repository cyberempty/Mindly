@echo off
title Mindly
cd /d "%~dp0"
if not exist "projects" mkdir "projects"
rem engines downloaded by an earlier version: give the program its own name
if exist "runtime\win\electron.exe" if not exist "runtime\win\Mindly.exe" ren "runtime\win\electron.exe" "Mindly.exe"
if exist "runtime\win\Mindly.exe" goto brand

echo.
echo  ============================================================
echo   Mindly - first start
echo   Downloading the app engine for Windows.
echo   This happens only once: afterwards Mindly works offline.
echo  ============================================================
echo.
set "MINDLY_URL=https://github.com/electron/electron/releases/download/v45.2.3/electron-v45.2.3-win32-x64.zip"
set "MINDLY_SHA=489cd061908e697394b004298bf5ffd345c935d10e8ca197ba819f019ab2dec0"
set "MINDLY_DIR=%~dp0runtime\win"
set "MINDLY_STEP=install"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0'); $i=$s.IndexOf('::'+'PS::'); Invoke-Expression $s.Substring($i+6)"
if errorlevel 1 (
  echo.
  echo  [Mindly] The engine could not be installed. Check the Internet connection
  echo           and run this file again. Or copy a ready-made runtime\win folder here.
  echo.
  pause
  exit /b 1
)

:brand
rem Task Manager shows the "file description" stored inside the exe (it says "Electron"): rewrite it once as "Mindly"
if exist "runtime\win\.branded" goto run
set "MINDLY_DIR=%~dp0runtime\win"
set "MINDLY_ICON=%~dp0static\icon.ico"
set "MINDLY_RC_URL=https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe"
set "MINDLY_RC_SHA=3e7801db1a5edbec91b49a24a094aad776cb4515488ea5a4ca2289c400eade2a"
set "MINDLY_STEP=brand"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0'); $i=$s.IndexOf('::'+'PS::'); Invoke-Expression $s.Substring($i+6)" >nul 2>&1

:run
start "" "runtime\win\Mindly.exe" "."
exit /b 0

::PS::
$ErrorActionPreference = 'Stop'
if ($env:MINDLY_STEP -eq 'brand') {
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $dir = $env:MINDLY_DIR; $exe = Join-Path $dir 'Mindly.exe'; $rc = Join-Path $env:TEMP 'mindly-rcedit.exe'
    Invoke-WebRequest -UseBasicParsing -Uri $env:MINDLY_RC_URL -OutFile $rc
    if ((Get-FileHash $rc -Algorithm SHA256).Hash -ne $env:MINDLY_RC_SHA) { throw 'rcedit checksum mismatch' }
    & $rc $exe --set-version-string FileDescription 'Mindly' --set-version-string ProductName 'Mindly' --set-version-string InternalName 'Mindly' --set-version-string OriginalFilename 'Mindly.exe' --set-version-string CompanyName 'Mindly' --set-version-string LegalCopyright 'MIT License' --set-icon $env:MINDLY_ICON
    if ($LASTEXITCODE -ne 0) { throw 'rcedit failed' }
    Remove-Item $rc -Force -ErrorAction SilentlyContinue
    # transparent NTFS compression (LZX): same files, roughly half the space; silently skipped where unsupported
    try { & compact.exe /c /s:"$dir" /a /i /q /exe:lzx | Out-Null } catch { }
    Set-Content -Path (Join-Path $dir '.branded') -Value 'ok'
  } catch { }
  exit 0
}
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $url = $env:MINDLY_URL; $dir = $env:MINDLY_DIR
  $zip = Join-Path $env:TEMP 'mindly-engine.zip'
  # 1) download with percentage
  $req = [Net.HttpWebRequest]::Create($url); $req.UserAgent = 'Mindly'
  $res = $req.GetResponse(); $len = $res.ContentLength
  $in = $res.GetResponseStream(); $out = [IO.File]::Create($zip)
  $buf = New-Object byte[] 262144; $tot = 0; $last = -1
  while (($n = $in.Read($buf, 0, $buf.Length)) -gt 0) {
    $out.Write($buf, 0, $n); $tot += $n
    if ($len -gt 0) {
      $p = [int](100 * $tot / $len)
      if ($p -ne $last) { $last = $p; Write-Host -NoNewline ("`r  Downloading...  {0}%   " -f $p) }
    }
  }
  $out.Close(); $in.Close(); $res.Close(); Write-Host ''
  # 2) verify
  Write-Host '  Verifying...'
  if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $env:MINDLY_SHA) { throw 'Checksum mismatch: the download is corrupted.' }
  # 3) extract with percentage
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  New-Item -ItemType Directory -Force $dir | Out-Null
  $z = [IO.Compression.ZipFile]::OpenRead($zip); $cnt = $z.Entries.Count; $k = 0; $last = -1
  foreach ($e in $z.Entries) {
    $dest = Join-Path $dir ($e.FullName -replace '/', '\')
    if ($e.FullName.EndsWith('/')) { New-Item -ItemType Directory -Force $dest | Out-Null }
    else {
      New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
    }
    $k++; $p = [int](100 * $k / $cnt)
    if ($p -ne $last) { $last = $p; Write-Host -NoNewline ("`r  Extracting...   {0}%   " -f $p) }
  }
  $z.Dispose(); Remove-Item $zip -Force; Write-Host ''
  # lighter engine: Mindly only needs English, so the other Chromium language files and the license page go
  Get-ChildItem (Join-Path $dir 'locales') -Filter *.pak -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'en-US.pak' } | Remove-Item -Force -ErrorAction SilentlyContinue
  Remove-Item (Join-Path $dir 'LICENSES.chromium.html') -Force -ErrorAction SilentlyContinue
  # the program gets its own name: Mindly.exe
  Rename-Item (Join-Path $dir 'electron.exe') 'Mindly.exe' -Force
  Write-Host '  Done. Starting Mindly...'
  exit 0
} catch {
  Write-Host ''
  Write-Host ('  Error: ' + $_.Exception.Message)
  exit 1
}
