$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

$changes = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git durumu okunamadı. Güncelleme durduruldu."
    exit 1
}

if ($changes.Count -gt 0) {
    Write-Host "Yerel değişiklikler var. Önce yayınlayın veya değişiklikleri çözün."
    exit 1
}

git fetch origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Uzak depo bilgileri alınamadı. Güncelleme durduruldu."
    exit 1
}

$localHead = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Error "Yerel commit bilgisi okunamadı. Güncelleme durduruldu."
    exit 1
}

$remoteHead = git rev-parse origin/main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Uzak main dalı okunamadı. Güncelleme durduruldu."
    exit 1
}

if ($localHead -eq $remoteHead) {
    Write-Host "TALHA RUNNER V2 zaten güncel."
    exit 0
}

$comparison = git rev-list --left-right --count HEAD...origin/main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Yerel ve uzak dallar karşılaştırılamadı. Güncelleme durduruldu."
    exit 1
}

$counts = $comparison.Trim() -split '\s+'
if ($counts.Count -ne 2) {
    Write-Error "Dal karşılaştırma sonucu anlaşılamadı. Güncelleme durduruldu."
    exit 1
}

$localOnly = [int]$counts[0]
$remoteOnly = [int]$counts[1]

if ($localOnly -eq 0 -and $remoteOnly -gt 0) {
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Fast-forward güncelleme başarısız oldu."
        exit 1
    }

    Write-Host "GÜNCELLEME TAMAMLANDI"
    exit 0
}

if ($localOnly -gt 0 -and $remoteOnly -eq 0) {
    Write-Host "Yerel main dalı uzak daldan ileride. Otomatik güncelleme yapılmadı."
    exit 1
}

Write-Host "Yerel ve uzak main dalları ayrışmış. Otomatik merge, rebase veya reset yapılmadı."
exit 1
