# ============================================================
#  委托出租原型 - 本地静态服务器
#  用法: powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8932
#  说明: 用 TcpListener 手写最小 HTTP 服务，不依赖 HttpListener/管理员权限。
# ============================================================
param(
    [int]$Port = 8932,
    [switch]$NoBrowser
)

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$root = [System.IO.Path]::GetFullPath($root)

if (-not (Test-Path (Join-Path $root 'index.html'))) {
    Write-Host "ERROR: index.html not found in: $root" -ForegroundColor Red
    exit 1
}

$mime = @{
    '.html'='text/html; charset=utf-8';  '.htm'='text/html; charset=utf-8'
    '.css' ='text/css; charset=utf-8';   '.js' ='application/javascript; charset=utf-8'
    '.json'='application/json; charset=utf-8'
    '.png' ='image/png';                 '.jpg'='image/jpeg'
    '.jpeg'='image/jpeg';                '.gif'='image/gif'
    '.svg' ='image/svg+xml';             '.ico'='image/x-icon'
    '.woff'='font/woff';                 '.woff2'='font/woff2'; '.ttf'='font/ttf'
}

$listener = $null
try {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
} catch {
    Write-Host "ERROR: cannot listen on port $Port" -ForegroundColor Red
    Write-Host "Try another port, e.g.  start-prototype.bat 8933" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor DarkGray
    exit 1
}

$url = "http://127.0.0.1:$Port/index.html"
Write-Host ""
Write-Host "  Prototype server is running" -ForegroundColor Green
Write-Host "  URL : $url" -ForegroundColor Cyan
Write-Host "  Dir : $root" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Close this window to stop." -ForegroundColor Yellow
Write-Host ""

if (-not $NoBrowser) {
    try { Start-Process $url | Out-Null } catch {}
}

while ($true) {
    $client = $null
    try {
        $client = $listener.AcceptTcpClient()
    } catch { break }

    try {
        $client.ReceiveTimeout = 5000
        $client.SendTimeout = 15000
        $stream = $client.GetStream()

        # --- 读完请求头（直到空行），避免客户端仍在发送时就把连接关掉 ---
        $sb = New-Object System.Text.StringBuilder
        $buf = New-Object byte[] 1024
        $guard = 0
        while ($guard -lt 64) {
            $guard++
            $n = $stream.Read($buf, 0, $buf.Length)
            if ($n -le 0) { break }
            [void]$sb.Append([System.Text.Encoding]::ASCII.GetString($buf, 0, $n))
            if ($sb.ToString().Contains("`r`n`r`n")) { break }
        }
        $headRaw = $sb.ToString()
        $reqLine = ($headRaw -split "`r`n")[0]

        $status = '200 OK'
        $body = $null
        $ctype = 'application/octet-stream'

        if ($reqLine -match '^\s*(\S+)\s+(\S+)') {
            $rawPath = $Matches[2]
            $q = $rawPath.IndexOf('?')
            if ($q -ge 0) { $rawPath = $rawPath.Substring(0, $q) }
            $rel = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
            $rel = $rel -replace '/', '\'
            $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))

            if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
                $status = '403 Forbidden'
                $body = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
            } elseif ((Test-Path -LiteralPath $full) -and -not (Get-Item -LiteralPath $full).PSIsContainer) {
                $ext = [System.IO.Path]::GetExtension($full).ToLower()
                if ($mime.ContainsKey($ext)) { $ctype = $mime[$ext] }
                $body = [System.IO.File]::ReadAllBytes($full)
            } else {
                $status = '404 Not Found'
                $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            }
        } else {
            $status = '400 Bad Request'
            $body = [System.Text.Encoding]::UTF8.GetBytes('400 Bad Request')
        }

        if ($null -eq $body) { $body = New-Object byte[] 0 }

        $head = "HTTP/1.1 $status`r`n" +
                "Content-Type: $ctype`r`n" +
                "Content-Length: $($body.Length)`r`n" +
                "Cache-Control: no-cache`r`n" +
                "Connection: close`r`n`r`n"
        $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
        $stream.Write($headBytes, 0, $headBytes.Length)
        if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
        $stream.Flush()
    } catch {
        # 单个请求失败不影响整体
    } finally {
        if ($client) { try { $client.Close() } catch {} }
    }
}

try { $listener.Stop() } catch {}
