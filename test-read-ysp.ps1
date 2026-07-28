$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
}

Write-Host "=== 读取 ysp_state (id=car) ===" -ForegroundColor Cyan
$result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state?id=eq.car&select=id,payload,updated_at,is_public' -Method GET -Headers $headers
$result | ConvertTo-Json -Depth 5
