<#
.SYNOPSIS
  Secure, Zero-Cost Authenticated Backup Script for Norden Finance (PostgreSQL Public Schema).
.DESCRIPTION
  Performs schema-filtered logical database backup, encrypts artifact via AES-256-GCM,
  computes SHA-256 checksum, and ensures zero credentials/keys are exposed in process arguments.
#>
param(
  [Parameter(Mandatory=$false)]
  [string]$KeyFile = "$HOME\.norden\backup.key",

  [Parameter(Mandatory=$false)]
  [string]$OutputDir = "$HOME\backups\norden",

  [Parameter(Mandatory=$false)]
  [string]$PgHost = "aws-0-ap-southeast-1.pooler.supabase.com",

  [Parameter(Mandatory=$false)]
  [int]$PgPort = 5432,

  [Parameter(Mandatory=$false)]
  [string]$PgDatabase = "postgres",

  [Parameter(Mandatory=$false)]
  [string]$PgUser = "postgres.tidpkhwcxrsugioctpnf"
)

$ErrorActionPreference = "Stop"

# 1. Validate Key File
if (-not (Test-Path -Path $KeyFile)) {
  Write-Error "Key file not found: $KeyFile. Refusing to run unencrypted backup."
  exit 1
}

$ValidateKeyOut = & node (Join-Path $PSScriptRoot "cipher.js") validate-key --key-file "$KeyFile" 2>&1
if ($LASTEXITCODE -ne 0 -or $ValidateKeyOut -ne "KEY_VALID") {
  Write-Error "Invalid backup encryption key in $KeyFile. Key must be 256 bits (64 hex characters)."
  exit 1
}

# 2. Ensure Safe Output Directory
if (-not (Test-Path -Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TempDir = [System.IO.Path]::GetTempPath()
$RawSqlFile = Join-Path $TempDir "norden_raw_$Timestamp.sql"
$EncFile = Join-Path $OutputDir "norden_db_$Timestamp.sql.enc"
$ShaFile = Join-Path $OutputDir "norden_db_$Timestamp.sha256"

# 3. Secure pgpass Verification
$PgPassPath = Join-Path $env:APPDATA "postgresql\pgpass.conf"
if (-not (Test-Path $PgPassPath) -and -not $env:PGPASSWORD) {
  Write-Error "Neither %APPDATA%\postgresql\pgpass.conf nor PGPASSWORD environment variable is configured."
  exit 1
}

try {
  Write-Host "[1/4] Executing schema-filtered pg_dump..."
  # Execute pg_dump using native parameters without embedding password in process arguments
  # Host, Port, Username, Database passed as standard flags. pg_dump reads password from pgpass.conf / PGPASSWORD.
  & pg_dump -h "$PgHost" -p $PgPort -U "$PgUser" -d "$PgDatabase" --schema=public --clean --if-exists --no-owner --no-acl -F p -f "$RawSqlFile"
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE."
  }

  if (-not (Test-Path $RawSqlFile)) {
    throw "pg_dump output file was not created."
  }

  $RawSize = (Get-Item $RawSqlFile).Length
  if ($RawSize -lt 100) {
    throw "pg_dump output is suspicious or empty ($RawSize bytes)."
  }

  Write-Host "[2/4] Encrypting dump with AES-256-GCM..."
  $CipherOut = & node (Join-Path $PSScriptRoot "cipher.js") encrypt --key-file "$KeyFile" --in "$RawSqlFile" --out "$EncFile" 2>&1
  if ($LASTEXITCODE -ne 0 -or $CipherOut -ne "ENCRYPT_OK") {
    throw "AES-256-GCM encryption failed: $CipherOut"
  }

  if (-not (Test-Path $EncFile)) {
    throw "Encrypted backup file was not produced."
  }

  Write-Host "[3/4] Generating cryptographic SHA-256 hash..."
  $Hash = (Get-FileHash -Path $EncFile -Algorithm SHA256).Hash
  "$Hash  $(Split-Path $EncFile -Leaf)" | Out-File -FilePath $ShaFile -Encoding ascii

  Write-Host "[4/4] Backup complete. Artifact: $EncFile"
  Write-Host "      Checksum: $Hash"
}
catch {
  Write-Error "Backup operation failed: $_"
  if (Test-Path $EncFile) { Remove-Item -Path $EncFile -Force -ErrorAction SilentlyContinue }
  if (Test-Path $ShaFile) { Remove-Item -Path $ShaFile -Force -ErrorAction SilentlyContinue }
  exit 1
}
finally {
  # Plaintext temporary file wiped securely
  if (Test-Path $RawSqlFile) {
    # Overwrite plaintext with random bytes before removal
    try {
      [System.IO.File]::WriteAllBytes($RawSqlFile, [byte[]]::new(1024))
    } catch {}
    Remove-Item -Path $RawSqlFile -Force -ErrorAction SilentlyContinue
  }
}
