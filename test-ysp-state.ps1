$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Content-Type' = 'application/json'
}

Write-Host "=== 测试 ysp_state GET ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state?limit=1' -Method GET -Headers $headers
    Write-Host "成功! 返回数据:" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "状态码: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n=== 测试 ysp_state POST (INSERT) ===" -ForegroundColor Cyan
$body = '[{"id":"car","payload":{"balance":99999,"updatedAt":"2026-07-01T00:00:00Z"},"is_public":true}]'
try {
    $result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state' -Method POST -Headers $headers -Body $body
    Write-Host "成功! 返回数据:" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Yellow
    }
}
