$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

$changes = @(git status --porcelain)
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git durumu okunamadı. Yayınlama durduruldu."
    exit 1
}

if ($changes.Count -eq 0) {
    Write-Host "Yayınlanacak değişiklik yok."
    exit 0
}

Write-Host "Yayınlanacak değişiklikler:"
$changes | ForEach-Object { Write-Host "  $_" }

git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Error "Dosyalar staging alanına eklenemedi. Yayınlama durduruldu."
    exit 1
}

$commitMessage = Read-Host "Commit mesajı (boş bırakırsanız: TALHA RUNNER V2 update)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "TALHA RUNNER V2 update"
}

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Error "Commit oluşturulamadı. Push yapılmadı."
    exit 1
}

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Push başarısız oldu."
    exit 1
}

Write-Host "YAYINLAMA TAMAMLANDI"
