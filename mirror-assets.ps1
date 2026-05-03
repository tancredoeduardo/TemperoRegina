$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundle = Join-Path $root "config-B1s7ZQvN.js"
$index = Join-Path $root "index.html"
$assetDir = Join-Path $root "assets\remote"
$manifest = Join-Path $root "assets\asset-map.json"

New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

$texts = @(
  [System.IO.File]::ReadAllText($bundle, [System.Text.Encoding]::UTF8),
  [System.IO.File]::ReadAllText($index, [System.Text.Encoding]::UTF8)
)

$pattern = 'https?://[^\s"'',`}]+\.(?:png|jpg|jpeg|webp|gif|svg)(?:\?[^\s"'',`}]*)?'
$urls = $texts | ForEach-Object {
  [regex]::Matches($_, $pattern) | ForEach-Object { $_.Value }
} | Sort-Object -Unique

$map = [ordered]@{}

foreach ($url in $urls) {
  try {
    $uri = [Uri]$url
    $name = [System.IO.Path]::GetFileName($uri.AbsolutePath)
    $ext = [System.IO.Path]::GetExtension($name)
    if ([string]::IsNullOrWhiteSpace($ext)) {
      $ext = ".bin"
    }

    $sha = [System.Security.Cryptography.SHA1]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($url)
    $hash = ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").Substring(0, 12).ToLowerInvariant()
    $safeBase = ([System.IO.Path]::GetFileNameWithoutExtension($name) -replace '[^a-zA-Z0-9_-]', '-')
    if ($safeBase.Length -gt 48) {
      $safeBase = $safeBase.Substring(0, 48)
    }

    $fileName = "$safeBase-$hash$ext"
    $outFile = Join-Path $assetDir $fileName
    $localUrl = "./assets/remote/$fileName"

    if (-not (Test-Path $outFile)) {
      Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -TimeoutSec 15
    }

    $map[$url] = $localUrl
  } catch {
    Write-Warning "Could not mirror ${url}: $($_.Exception.Message)"
  }
}

$bundleText = [System.IO.File]::ReadAllText($bundle, [System.Text.Encoding]::UTF8)
$indexText = [System.IO.File]::ReadAllText($index, [System.Text.Encoding]::UTF8)

foreach ($entry in $map.GetEnumerator()) {
  $bundleText = $bundleText.Replace($entry.Key, $entry.Value)
  $indexText = $indexText.Replace($entry.Key, $entry.Value)
}

[System.IO.File]::WriteAllText($bundle, $bundleText, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($index, $indexText, [System.Text.UTF8Encoding]::new($false))

$map | ConvertTo-Json | Set-Content -Path $manifest -Encoding UTF8
Write-Output "Mirrored $($map.Count) assets."
