# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
# Read-only evidence from the task-owned browser on this interactive desktop.
param(
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$BrowserPid,
    [Parameter(Mandatory=$true)][ValidateSet('chrome','msedge')][string]$BrowserName,
    [Parameter(Mandatory=$true)][string]$Profile,
    [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference = 'Stop'
$receiptPath = Join-Path $Output 'userscript-manager-native-permission.json'
$imagePath = Join-Path $Output 'userscript-manager-native-permission.png'
$tempImagePath = Join-Path $Output "userscript-manager-native-permission-$([Guid]::NewGuid().ToString('N')).tmp.png"
$receipt = @{ status = 'skipped'; reason = 'ownership-unverified'; permissionGrantAttempted = $false }

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class XegPermissionWindow {
    [StructLayout(LayoutKind.Sequential)] public struct Rect {
        public int Left, Top, Right, Bottom;
    }
    private delegate bool EnumCallback(IntPtr hwnd, IntPtr value);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumCallback callback, IntPtr value);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
    public static IntPtr[] OwnedVisibleWindows(uint expectedPid) {
        var found = new List<IntPtr>();
        int visited = 0;
        bool completed = EnumWindows(delegate(IntPtr hwnd, IntPtr ignored) {
            if (++visited > 512) return false;
            uint pid;
            if (GetWindowThreadProcessId(hwnd, out pid) != 0 && pid == expectedPid &&
                IsWindowVisible(hwnd)) found.Add(hwnd);
            return found.Count <= 8;
        }, IntPtr.Zero);
        if (!completed || found.Count > 8) throw new InvalidOperationException("window-enumeration-limit");
        return found.ToArray();
    }
    public static bool IsOwned(IntPtr hwnd, uint expectedPid) {
        uint pid;
        return hwnd != IntPtr.Zero && GetWindowThreadProcessId(hwnd, out pid) != 0 &&
            pid == expectedPid && IsWindowVisible(hwnd);
    }
}
'@

function Test-OwnedProcess {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $BrowserPid"
    if ($null -eq $process -or $null -eq $process.ExecutablePath -or
        $null -eq $process.CommandLine -or $null -eq $process.CreationDate) {
        throw 'browser-process-unavailable'
    }
    $leaf = [IO.Path]::GetFileName($process.ExecutablePath)
    if ($leaf -ine "$BrowserName.exe" -or
        $process.ExecutablePath.StartsWith('\\') -or
        -not [IO.File]::Exists($process.ExecutablePath) -or
        ([IO.File]::GetAttributes($process.ExecutablePath) -band [IO.FileAttributes]::ReparsePoint)) {
        throw 'browser-executable-unverified'
    }
    $resolvedProfile = (Resolve-Path -LiteralPath $Profile).ProviderPath.TrimEnd('\')
    $escaped = [regex]::Escape($resolvedProfile)
    if ($process.CommandLine -notmatch "(?i)(?:^|\s)`"?--user-data-dir=`"?$escaped`"?(?=\s|$)") {
        throw 'browser-profile-unverified'
    }
    $ownSession = [Diagnostics.Process]::GetCurrentProcess().SessionId
    if ($ownSession -eq 0 -or [int]$process.SessionId -ne $ownSession) {
        throw 'browser-session-unverified'
    }
    return $process
}

try {
    $before = Test-OwnedProcess
    $windows = [XegPermissionWindow]::OwnedVisibleWindows([uint32]$BrowserPid)
    $foreground = [XegPermissionWindow]::GetForegroundWindow()
    if ($windows.Count -eq 0 -or $foreground -eq [IntPtr]::Zero -or
        -not ($windows -contains $foreground)) { throw 'owned-window-not-foreground' }
    $rect = [XegPermissionWindow+Rect]::new()
    if (-not [XegPermissionWindow]::GetWindowRect($foreground, [ref]$rect)) {
        throw 'window-rect-unavailable'
    }
    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -lt 200 -or $height -lt 100 -or $width -gt 1920 -or $height -gt 1200) {
        throw 'window-size-out-of-bounds'
    }

    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $root = [Windows.Automation.AutomationElement]::FromHandle($foreground)
    if ($null -eq $root -or $root.Current.ProcessId -ne $BrowserPid) {
        throw 'uia-root-unverified'
    }
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@($root, 0))
    $controls = New-Object System.Collections.ArrayList
    $visited = 0
    while ($queue.Count -gt 0 -and $visited -lt 256) {
        $entry = $queue.Dequeue()
        $element = $entry[0]
        $depth = [int]$entry[1]
        $visited++
        try {
            $current = $element.Current
            if ($current.ProcessId -ne $BrowserPid) { continue }
            $name = [string]$current.Name
            $type = [string]$current.ControlType.ProgrammaticName
            [void]$controls.Add(@{ depth = $depth; name = $name.Substring(0, [Math]::Min(120, $name.Length));
                controlType = $type.Substring(0, [Math]::Min(80, $type.Length)) })
            if ($depth -ge 8) { continue }
            $child = $walker.GetFirstChild($element)
            $siblings = 0
            while ($null -ne $child -and $siblings -lt 64 -and $queue.Count -lt 256) {
                $queue.Enqueue(@($child, $depth + 1))
                $siblings++
                $child = $walker.GetNextSibling($child)
            }
        } catch { throw 'uia-inspection-unavailable' }
    }
    if ($controls.Count -eq 0) { throw 'uia-inspection-empty' }
    $after = Test-OwnedProcess
    if ($before.CreationDate -ne $after.CreationDate -or
        [XegPermissionWindow]::GetForegroundWindow() -ne $foreground -or
        -not [XegPermissionWindow]::IsOwned($foreground, [uint32]$BrowserPid)) {
        throw 'window-identity-changed'
    }
    Add-Type -AssemblyName System.Drawing
    $bitmap = [Drawing.Bitmap]::new($width, $height,
        [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size,
                [Drawing.CopyPixelOperation]::SourceCopy)
        } finally { $graphics.Dispose() }
        $final = Test-OwnedProcess
        if ($before.CreationDate -ne $final.CreationDate -or
            [XegPermissionWindow]::GetForegroundWindow() -ne $foreground) {
            throw 'window-identity-changed-after-capture'
        }
        $bitmap.Save($tempImagePath, [Drawing.Imaging.ImageFormat]::Png)
    } finally { $bitmap.Dispose() }
    Move-Item -LiteralPath $tempImagePath -Destination $imagePath
    $receipt = @{ status = 'captured'; permissionGrantAttempted = $false;
        windowCount = $windows.Count; width = $width; height = $height;
        controls = @($controls.ToArray()); visitedControls = $visited;
        truncated = ($queue.Count -gt 0) }
} catch {
    if (Test-Path -LiteralPath $tempImagePath) { Remove-Item -LiteralPath $tempImagePath -Force }
    $reason = [string]$_.Exception.Message
    if ($reason -notin @('browser-process-unavailable','browser-executable-unverified',
        'browser-profile-unverified','browser-session-unverified','window-enumeration-limit',
        'owned-window-not-foreground','window-rect-unavailable','window-size-out-of-bounds',
        'uia-root-unverified','uia-inspection-unavailable','uia-inspection-empty',
        'window-identity-changed','window-identity-changed-after-capture')) {
        $reason = 'native-capture-unavailable'
    }
    $receipt = @{ status = 'skipped'; reason = $reason; permissionGrantAttempted = $false }
} finally {
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 6))
}
