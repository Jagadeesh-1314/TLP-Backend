@echo off
echo Enter Module Name && set /p name=

set mpath=%~dp0..\src\%name%

mkdir %mpath%


if %errorlevel% neq 0 (
    echo Module can't be created since another module with same name already exist
    exit /b %errorlevel%
)
echo import { Router } from "express"; > %mpath%\index.ts
echo.  >> %mpath%\index.ts
echo const router = Router(); >> %mpath%\index.ts
echo. >> %mpath%\index.ts
echo // Defining the core path from which this module should be accessed >> %mpath%\index.ts
echo. >> %mpath%\index.ts
echo export default router; >> %mpath%\index.ts 

echo import { Router } from "express"; > %mpath%\routes.ts
echo. >> %mpath%\routes.ts
echo const router: Router = Router(); >> %mpath%\routes.ts
echo. >> %mpath%\routes.ts
echo // Registering all the module routes here>> %mpath%\routes.ts
echo. >> %mpath%\routes.ts
echo. >> %mpath%\routes.ts
echo export default router; >> %mpath%\routes.ts

echo. > %mpath%\controller.ts

echo Module created at %mpath%
echo.
echo Happy Coding:)

@echo on