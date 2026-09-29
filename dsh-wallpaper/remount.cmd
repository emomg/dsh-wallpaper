@echo off
REM Mount the wallpaper plugin into dsh by (re)writing the home patch layer.
REM Safe to run repeatedly: it rewrites the single mount file from the
REM plugin's own location, so it always points at the current checkout.

setlocal
set PATCH=%USERPROFILE%\.dsh\cordis.patch.yml
set PLUGIN=%~dp0lib\index.js

if not exist "%PLUGIN%" (
	echo  Cannot mount: %PLUGIN% is missing.
	exit /b 1
)

REM The patch layer accepts a forward-slash absolute path and resolves it
REM against the patch file, so a Windows path works as written.
for %%I in ("%PLUGIN%") do set POSIX=%%~fI
set POSIX=%POSIX:\=/%

> "%PATCH%" echo # dsh home-level user patch layer.
>> "%PATCH%" echo #
>> "%PATCH%" echo # Written by dsh-wallpaper\remount.cmd. This is the only file the
>> "%PATCH%" echo # plugin adds to the dsh installation: delete it to unmount, or run
>> "%PATCH%" echo # dsh-wallpaper\unmount.cmd. dsh's own packages are never modified.
REM A blank line separates the comment block from the patch list. "echo."
REM writes an empty line; "echo ." would emit a literal dot and break the YAML.
>> "%PATCH%" echo.
>> "%PATCH%" echo - insert:
>> "%PATCH%" echo     - id: wallpaper
>> "%PATCH%" echo       name: '%POSIX%'

echo.
echo  Mounted dsh-wallpaper
echo  =====================
echo   plugin: %PLUGIN%
echo   patch:  %PATCH%
echo.
echo  Start dsh (any profile) and the wallpaper control appears in the
echo  bottom-right corner of the web UI.
echo.

if exist "%PATCH%.backup" del "%PATCH%.backup" >nul 2>&1
