<#
.SYNOPSIS
  Secure Decryption and Restore Script for Norden Finance.
.DESCRIPTION
  Decrypts an AES-256-GCM encrypted backup file, verifies the authentication tag,
  and optionally restores into a specified PostgreSQL database.
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$EncryptedBackupFile,

  [Parameter(Mandatory=$false)]
  [string]$KeyFile = "$HOME\.norden\backup.key",

  [Parameter(Mandatory=$false)]
  [switch]$DecryptOnly,

  [Parameter(Mandatory=$false)]
  [string]$TargetPgHost = "localhost",

  [Parameter(Mandatory=$false)]
  [int]$TargetPgPort = 5432,

  [Parameter(Mandatory=$false)]
  [string]$TargetPgDatabase = "norden_restore_test",

  [Parameter(Mandatory=$false)]
  [string]$TargetPgUser = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $EncryptedBackupFile)) {
  Write-Error "Encrypted backup file not found: $EncryptedBackupFile"
  exit 1
}

if (-not (Test-Path -Path $KeyFile)) {
  Write-Error "Key file not found: $KeyFile"
  exit 1
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TempDir = [System.IO.Path]::GetTempPath()
$DecryptedSqlFile = Join-Path $TempDir "norden_decrypted_$Timestamp.sql"

try {
  Write-Host "[1/3] Decrypting and authenticating artifact via AES-256-GCM..."
  $CipherOut = & node (Join-Path $PSScriptRoot "cipher.js") decrypt --key-file "$KeyFile" --in "$EncryptedBackupFile" --out "$DecryptedSqlFile" 2>&1
  if ($LASTEXITCODE -ne 0 -or $CipherOut -ne "DECRYPT_OK") {
    throw "Decryption/Authentication failed: $CipherOut"
  }

  $DecSize = (Get-Item $DecryptedSqlFile).Length
  Write-Host "[2/3] Artifact authenticated. Decrypted size: $DecSize bytes."

  if ($DecryptOnly) {
    Write-Host "DecryptOnly requested. Plaintext file retained at: $DecryptedSqlFile"
    return
  }

  Write-Host "[3/3] Restoring into target database: $TargetPgDatabase on $TargetPgHost:$TargetPgPort..."
  & psql -h "$TargetPgHost" -p $TargetPgPort -U "$TargetPgUser" -d "$TargetPgDatabase" -f "$DecryptedSqlFile"
  if ($LASTEXITCODE -ne 0) {
    throw "psql restore failed with exit code $LASTEXITCODE."
  }
  Write-Host "Restore complete."
}
catch {
  Write-Error "Restore operation failed: $_"
  exit 1
}
finally {
  if (-not $DecryptOnly -and (Test-Path $DecryptedSqlFile)) {
    try {
      [System.IO.File]::WriteAllBytes($DecryptedSqlFile, [byte[]]::new(1024))
    } catch {}
    Remove-Item -Path $DecryptedSqlFile -Force -ErrorAction SilentlyContinue
  }
}
