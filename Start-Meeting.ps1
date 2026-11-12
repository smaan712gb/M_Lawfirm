param([ValidateRange(1024,60000)][int]$Port=3333,[switch]$NoBrowser,[switch]$Check)
$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
$meetingData=Join-Path $projectRoot '.meeting-data'
$nodePath=Join-Path $projectRoot '.tools\node_modules\node\bin\node.exe'
if(-not(Test-Path -LiteralPath $nodePath)){$nodePath=(Get-Command node -ErrorAction Stop).Source}
$voicePython=Join-Path $projectRoot '.voice-venv\Scripts\python.exe'
$voicePort=$Port+500
$children=@()
New-Item -ItemType Directory -Path $meetingData -Force | Out-Null
$env:DATA_DIR=$meetingData
$env:HOST='127.0.0.1'
$env:PORT=[string]$Port
$env:AUTH_MODE='demo'
$env:WORKSPACE_PASSWORD=''
$env:VOICE_SERVICE_URL=''
$env:VOICE_SERVICE_TOKEN=''
$env:VOICE_ENGINE='fixed'
$env:VOICE_PRELOAD_STT='true'
$env:MODEL_BASE_URL=''
$env:MODEL_API_KEY=''
$env:MODEL_NAME=''
$env:MODEL_LOCAL='false'
$env:MODEL_THINKING=''
$env:AGENT_PYTHON_PATH=''
$env:LAW_FEED_URLS=''
$env:VERIFICATION_DELIVERY_URL=''
$env:RECEPTION_BRIDGE_TOKEN=''
$url="http://127.0.0.1:$Port"
try {
    $probe=[System.Net.Sockets.TcpClient]::new()
    try {$probe.Connect('127.0.0.1',$Port);throw "Port $Port is already in use. Close the old meeting session or use -Port 3344."}
    catch [System.Net.Sockets.SocketException] {} finally {$probe.Dispose()}
    if(Test-Path -LiteralPath $voicePython){
        $env:HF_HOME=Join-Path $projectRoot '.voice-cache'
        $env:VOICE_PORT=[string]$voicePort
        $voiceScript=Join-Path $projectRoot 'voice\service.py'
        $voice=Start-Process -FilePath $voicePython -ArgumentList @('"'+$voiceScript+'"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $meetingData 'voice.log') -RedirectStandardError (Join-Path $meetingData 'voice-error.log')
        $children+=$voice
        for($attempt=0;$attempt -lt 60;$attempt++){
            try {$health=Invoke-RestMethod "http://127.0.0.1:$voicePort/health" -TimeoutSec 1;if($health.status -eq 'ready'){$env:VOICE_SERVICE_URL="http://127.0.0.1:$voicePort";break}}catch{}
            if($voice.HasExited){break}
            Start-Sleep -Milliseconds 500
        }
    }
    $credentialPath=Join-Path $projectRoot '.local-secrets\drafting.json'
    if(Test-Path -LiteralPath $credentialPath){
        $credential=Get-Content -LiteralPath $credentialPath -Raw | ConvertFrom-Json
        if($credential.baseUrl -ne 'https://api.deepseek.com' -or $credential.model -ne 'deepseek-flash'){throw 'Drafting configuration is not recognized. Run Connect Drafting.cmd again.'}
        $secret=ConvertTo-SecureString -String $credential.apiKeyProtected
        $env:MODEL_API_KEY=[System.Net.NetworkCredential]::new('', $secret).Password
        $env:MODEL_BASE_URL=$credential.baseUrl
        $env:MODEL_NAME=$credential.model
        $env:MODEL_THINKING='disabled'
        $agentPython=Join-Path $projectRoot '.hermes-verified-venv\Scripts\python.exe'
        if(Test-Path -LiteralPath $agentPython){$env:AGENT_PYTHON_PATH=$agentPython}
    }
    $serverScript=Join-Path $projectRoot 'server.mjs'
    $server=Start-Process -FilePath $nodePath -ArgumentList @('"'+$serverScript+'"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $meetingData 'workspace.log') -RedirectStandardError (Join-Path $meetingData 'workspace-error.log')
    $children+=$server
    $env:MODEL_API_KEY=''
    $secret=$null
    $credential=$null
    $ready=$false
    for($attempt=0;$attempt -lt 30;$attempt++){
        try {$health=Invoke-RestMethod "$url/api/health" -TimeoutSec 1;if($health.status -eq 'ok'){$ready=$true;break}}catch{}
        if($server.HasExited){throw 'Workspace could not start. See .meeting-data/workspace-error.log.'}
        Start-Sleep -Milliseconds 500
    }
    if(-not $ready){throw 'The workspace did not become ready.'}
    Write-Host "M Law meeting workspace: $url/#os/onboarding"
    Write-Host 'Separate fictional meeting records. No firm number or mailbox is connected.'
    if($health.modelConfigured){Write-Host 'Live drafting is enabled. Requests use the connected API account.'}
    else {Write-Host 'Live drafting is not connected. Run Connect Drafting.cmd to configure it.'}
    if(-not $env:VOICE_SERVICE_URL){Write-Host 'Voice samples are available. Live microphone turns need voice setup.'}
    if(-not $NoBrowser -and -not $Check){Start-Process -FilePath "$url/#os/onboarding"}
    if($Check){Write-Host 'Launch check passed. Stopping this test session.'}
    else {Read-Host 'Keep this window open for the meeting. Press Enter to stop the workspace' | Out-Null}
} finally {
    $env:MODEL_API_KEY=''
    foreach($child in $children){$child.Refresh();if(-not $child.HasExited){$child.Kill();$child.WaitForExit()}}
}
