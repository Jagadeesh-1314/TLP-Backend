@echo off

set "DIR_NAMES=%~dp0..\tmp %~dp0..\log %~dp0..\backup"

for %%i in (%DIR_NAMES%) do (

    if not exist "%%i" (
        echo Creating dir "%%i"...
        mkdir %%i 
        if %errorlevel% neq 0 (
            echo Could not create dir %%i
            exit /b %errorlevel%
        )
    ) else (
        echo %%i already exist.
    )
)


exit /b 0