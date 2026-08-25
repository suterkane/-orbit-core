@echo off
setlocal
set "ORBIT_URL=https://orbit-core-tawny.vercel.app/index.html?panorama=dual"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Google Chrome wurde nicht gefunden.
  pause
  exit /b 1
)
start "ORBIT PANORAMA" "%CHROME%" --app="%ORBIT_URL%" --window-position=0,0 --window-size=5120,1440 --force-device-scale-factor=1
endlocal
