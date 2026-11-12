$ErrorActionPreference='Stop'
try {
    $key=[Console]::In.ReadToEnd().Trim()
    if($key.Length -lt 20 -or $key -match '\s'){throw 'Invalid key'}
    $protected=ConvertTo-SecureString -String $key -AsPlainText -Force | ConvertFrom-SecureString
    $directory=Join-Path (Split-Path $PSScriptRoot -Parent) '.local-secrets'
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    @{baseUrl='https://api.deepseek.com';model='deepseek-flash';thinking='disabled';apiKeyProtected=$protected} |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory 'drafting.json') -Encoding utf8
    Write-Output 'saved'
} catch {Write-Output 'Could not save the protected credential.';exit 1}
finally {$key=$null;$protected=$null}
