# Affiche les IPv4 utiles pour remplir .env (EXPO_PUBLIC_API_URL, etc.)
Write-Host "Adresses IPv4 (hors loopback) :" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notmatch '^127\.' } |
  Sort-Object InterfaceAlias |
  ForEach-Object { Write-Host ("  {0,-40} {1}" -f $_.InterfaceAlias, $_.IPAddress) }
