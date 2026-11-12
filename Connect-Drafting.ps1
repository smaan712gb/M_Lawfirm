param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
$nodePath=Join-Path $PSScriptRoot '.tools\node_modules\node\bin\node.exe'
if(-not(Test-Path -LiteralPath $nodePath)){$nodePath=(Get-Command node -ErrorAction Stop).Source}
$scriptPath=Join-Path $PSScriptRoot 'scripts\connect-drafting.mjs'
$child=Start-Process -FilePath $nodePath -ArgumentList @('"'+$scriptPath+'"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
try {
    $ready=$false
    for($attempt=0;$attempt -lt 20;$attempt++){
        if($child.HasExited){throw 'Setup could not start. Check whether a setup page is already open.'}
        try {$null=Invoke-WebRequest 'http://127.0.0.1:3433/' -TimeoutSec 1;$ready=$true;break}catch{Start-Sleep -Milliseconds 250}
    }
    if(-not $ready){throw 'The private setup page did not start.'}
    if(-not $NoBrowser){Start-Process -FilePath 'http://127.0.0.1:3433/'}
    Write-Host 'Private key setup: http://127.0.0.1:3433/'
    Read-Host 'After saving your key, press Enter to close setup' | Out-Null
} finally {$child.Refresh();if(-not $child.HasExited){$child.Kill();$child.WaitForExit()}}
