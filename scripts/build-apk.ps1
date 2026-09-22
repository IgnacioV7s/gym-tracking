# Builds and signs the Android TWA that wraps the deployed PWA.
#
# Requirements (one-off): android/jdk (Temurin 17), android/release.keystore and
# the Android SDK with build-tools 35. The keystore must match the fingerprint
# published in public/.well-known/assetlinks.json, or Android shows a URL bar.
#
# Usage: pwsh scripts/build-apk.ps1 [version]
param([string]$Version = "1.0.0")

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "..\android" | Resolve-Path
Set-Location $root

$env:JAVA_HOME = "$root\jdk"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$buildTools = "$env:ANDROID_HOME\build-tools\35.0.0"

# Keep the version in the gradle file in sync with the requested one.
(Get-Content app\build.gradle) -replace 'versionName "[^"]*"', "versionName `"$Version`"" |
  Set-Content app\build.gradle

& .\gradlew.bat assembleRelease --console=plain -q

$unsigned = "app\build\outputs\apk\release\app-release-unsigned.apk"
$aligned = "app\build\outputs\apk\release\app-release-aligned.apk"
$final = "gym-tracking-$Version.apk"

& "$buildTools\zipalign.exe" -p -f 4 $unsigned $aligned
& "$buildTools\apksigner.bat" sign `
  --ks release.keystore --ks-key-alias gymtracking `
  --ks-pass pass:gymtracking --key-pass pass:gymtracking `
  --out $final $aligned
& "$buildTools\apksigner.bat" verify --print-certs $final | Select-String "SHA-256 digest"

Write-Host "`nAPK ready: $root\$final"
