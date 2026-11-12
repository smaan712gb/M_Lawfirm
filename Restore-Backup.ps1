param([Parameter(Mandatory=$true)][string]$BackupFile,[Parameter(Mandatory=$true)][string]$NewDirectory)
$ErrorActionPreference='Stop'
if(Test-Path -LiteralPath $NewDirectory){throw 'Choose a new directory. Restoration never overwrites an existing workspace.'}
$secret=Read-Host 'Backup passphrase' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $passphrase=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $passphrase | & node (Join-Path $PSScriptRoot 'scripts\backup.mjs') restore $BackupFile $NewDirectory
    if($LASTEXITCODE -ne 0){throw 'Recovery failed. Do not point the running workspace at the recovery directory.'}
} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$passphrase=$null}
