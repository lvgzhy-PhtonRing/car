$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Content-Type' = 'application/json'
}

Write-Host "=== 测试 GET ysp_state ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state?limit=1' -Method GET -Headers $headers
    Write-Host "成功!" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    Write-Host "状态码: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n=== 测试 GET car_state ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/car_state?limit=1' -Method GET -Headers $headers
    Write-Host "成功!" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
}
