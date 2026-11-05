# BLACK-OUT — 실습 호스팅(FTP) 업로드
# 사용법 (C:\readyon 에서):
#   $env:FTP_PASS='비밀번호'; powershell -ExecutionPolicy Bypass -File scripts\deploy-ftp.ps1 team2
# - 비밀번호는 파일에 저장하지 않고 FTP_PASS 환경변수로만 받습니다.
# - 지정한 팀 폴더(team1~team8)가 FTP에 이미 있을 때만 올립니다. 다른 조 폴더와 최상위 index.html은 건드리지 않습니다.
param([Parameter(Mandatory = $true)][string]$Team)
$ErrorActionPreference = 'Stop'
$FtpHost = 'educnp.mycafe24.com'
$FtpUser = 'educnp'

if ($Team -notmatch '^team[1-8]$') { throw '팀 폴더는 team1 ~ team8 중 하나여야 합니다.' }
if (-not $env:FTP_PASS) { throw 'FTP_PASS 환경변수에 비밀번호를 넣어 주세요.' }
Set-Location (Split-Path $PSScriptRoot)
$auth = "${FtpUser}:$($env:FTP_PASS)"

function Get-FtpList([string]$path) {
  $out = curl.exe -s --list-only --user $auth "ftp://$FtpHost/$path"
  if ($LASTEXITCODE) { throw "FTP 접속 실패 (curl 코드 $LASTEXITCODE). 아이디·비밀번호를 확인해 주세요." }
  return @($out | ForEach-Object { $_.Trim() })
}

# 팀 폴더 위치 찾기: 최상위 또는 www/ 아래
$root = Get-FtpList ''
if ($root -contains $Team) { $base = $Team }
elseif (($root -contains 'www') -and ((Get-FtpList 'www/') -contains $Team)) { $base = "www/$Team" }
else { throw "FTP에서 '$Team' 폴더를 찾지 못했습니다. 최상위 목록: $($root -join ', ')" }
Write-Host "업로드 위치: /$base/"

# 사이트에 필요한 파일만 (readykit은 엔진과 대피시설 데이터만)
$files = git ls-files index.html make.html css js assets readykit/dist/engine.mjs readykit/dist/data
$i = 0
foreach ($f in $files) {
  $i++
  curl.exe -sS --ftp-create-dirs -T $f --user $auth "ftp://$FtpHost/$base/$f"
  if ($LASTEXITCODE) { throw "업로드 실패: $f (curl 코드 $LASTEXITCODE)" }
  Write-Host "[$i/$($files.Count)] $f"
}
Write-Host "완료: http://$FtpHost/$Team/"
