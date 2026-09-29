@echo off
REM Unmount the wallpaper plugin from dsh and restore its previous state.
REM
REM The plugin touches exactly one file in the dsh installation:
REM   %USERPROFILE%\.dsh\cordis.patch.yml
REM Removing that file is the whole unmount. dsh's own packages are never
REM modified, so nothing else needs restoring.

setlocal
set PATCH=%USERPROFILE%\.dsh\cordis.patch.yml
set WORKSPACE=%~dp0

echo.
echo  Unmounting dsh-wallpaper
echo  =========================
echo.

if not exist "%PATCH%" (
	echo  Nothing to do: %PATCH% does not exist.
	echo  The plugin is already unmounted.
	goto :done
)

REM Back up rather than delete, so a re-mount is one copy away.
if not exist "%PATCH%.backup" (
	copy "%PATCH%" "%PATCH%.backup" >nul
	echo  Saved current patch layer to %PATCH%.backup
)

del "%PATCH%" >nul 2>&1
if exist "%PATCH%" (
	echo  FAILED to remove %PATCH%
	echo  Close any dsh process holding the file, then run this again.
	goto :done
)

echo  Removed %PATCH%
echo.
echo  dsh will start clean on its next launch. Wallpaper settings and the
echo  imported library stay in the browser's localStorage under
echo  "dsh-wallpaper:settings"; clear that key in the browser to reset it.
echo.
echo  To reinstall:
echo    1. cd "%WORKSPACE%"
echo    2. git checkout main
echo    3. dsh-wallpaper\remount.cmd

:done
echo.
pause
