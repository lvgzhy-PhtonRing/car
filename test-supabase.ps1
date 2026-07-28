$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}

$body = '[{"id":"car","payload":{"balance":12345,"updatedAt":"2026-07-01T00:00:00Z"},"is_public":true}]'

Write-Host "=== INSERT ===" -ForegroundColor Cyan
$result = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state' -Method POST -Headers $headers -Body $body
$result | ConvertTo-Json -Depth 5

Write-Host "`n=== READ ===" -ForegroundColor Cyan
$readHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHhtYnNhZGRlYnhsYWxsZ29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDA3MjAsImV4cCI6MjA5MjA3NjcyMH0.gdptFoYcpfHtKRcsfwU-tnSteicHYjwa_znLLzBc3pE'
}
$readResult = Invoke-RestMethod -Uri 'https://mqdxmbsaddebxlallgos.supabase.co/rest/v1/ysp_state?id=eq.car&select=payload,updated_at' -Method GET -Headers $readHeaders
$readResult | ConvertTo-Json -Depth 5
