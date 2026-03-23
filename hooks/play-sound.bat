@echo off
setlocal

set "ps_exe=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if exist "%ps_exe%" (
  "%ps_exe%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
    "[void][Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');" ^
    "[System.Media.SystemSounds]::Asterisk.Play();"
  exit /b 0
)

echo 
exit /b 0
