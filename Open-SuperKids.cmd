@echo off
rem Opens this folder in a separate VS Code instance whose Claude uses its own login.
rem The separate --user-data-dir forces a new VS Code process, so it picks up
rem CLAUDE_CONFIG_DIR instead of joining your already-running VS Code windows.

set "CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude-superkids"
set "VSCODE_DATA=%USERPROFILE%\.vscode-superkids"

rem First run: copy your normal VS Code settings and keybindings so it feels the same.
if not exist "%VSCODE_DATA%\User" (
  mkdir "%VSCODE_DATA%\User"
  if exist "%APPDATA%\Code\User\settings.json" copy "%APPDATA%\Code\User\settings.json" "%VSCODE_DATA%\User\" >nul
  if exist "%APPDATA%\Code\User\keybindings.json" copy "%APPDATA%\Code\User\keybindings.json" "%VSCODE_DATA%\User\" >nul
)

start "" code --user-data-dir "%VSCODE_DATA%" "%~dp0."
