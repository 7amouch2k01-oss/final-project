$ErrorActionPreference = 'Stop'
$javaDir = "$env:LOCALAPPDATA\Java"
$jdkPath = "$javaDir\jdk-17.0.12+7"
$zipPath = "$env:TEMP\openjdk17.zip"

if (-not (Test-Path $javaDir)) {
    New-Item -ItemType Directory -Force -Path $javaDir | Out-Null
}

if (-not (Test-Path "$jdkPath\bin\java.exe")) {
    Write-Host "Downloading OpenJDK 17 portable..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath
    Write-Host "Extracting JDK 17..."
    Expand-Archive -Path $zipPath -DestinationPath $javaDir -Force
    Remove-Item $zipPath -Force
}

Write-Host "Java 17 version:"
& "$jdkPath\bin\java.exe" -version
