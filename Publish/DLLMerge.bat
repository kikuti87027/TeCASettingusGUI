SET PubPath=%~dp0
SET SIGNPath=D:\Signingèÿñæèë
SET EXEpath=C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64
cd %EXEpath%
signtool.exe sign /fd sha256 /f %SIGNPath%\2023Version\photron2023.pfx /p "photron_fcxMDW++13++" /t http://timestamp.digicert.com  /v %~dp0%1
cd %PubPath%
 