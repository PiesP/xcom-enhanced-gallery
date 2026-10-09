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
$receipt = @{ status = 'skipped'; reason = 'ownership-unverified';
    capture = 'uia-only'; screenshot = 'not-captured'; permissionGrantAttempted = $false }

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class XegPermissionWindow {
    private delegate bool EnumCallback(IntPtr hwnd, IntPtr value);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumCallback callback, IntPtr value);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
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
    $foregroundOwnedAndVisible = [XegPermissionWindow]::IsOwned($foreground, [uint32]$BrowserPid)
    if ($before.CreationDate -ne $after.CreationDate -or
        [XegPermissionWindow]::GetForegroundWindow() -ne $foreground -or
        -not $foregroundOwnedAndVisible) {
        throw 'window-identity-changed'
    }
    $receipt = @{ status = 'captured'; capture = 'uia-only'; screenshot = 'not-captured';
        permissionGrantAttempted = $false;
        browserPid = [int]$before.ProcessId;
        creationUtcTicks = ([datetime]$before.CreationDate).ToUniversalTime().Ticks;
        browserSessionId = [int]$before.SessionId;
        observerSessionId = [Diagnostics.Process]::GetCurrentProcess().SessionId;
        foregroundHandle = $foreground.ToInt64();
        foregroundOwnedAndVisible = $foregroundOwnedAndVisible;
        uiaRootProcessId = [int]$root.Current.ProcessId;
        windowCount = $windows.Count;
        controls = @($controls.ToArray()); visitedControls = $visited;
        truncated = ($queue.Count -gt 0) }
} catch {
    $reason = [string]$_.Exception.Message
    if ($reason -notin @('browser-process-unavailable','browser-executable-unverified',
        'browser-profile-unverified','browser-session-unverified','window-enumeration-limit',
        'owned-window-not-foreground',
        'uia-root-unverified','uia-inspection-unavailable','uia-inspection-empty',
        'window-identity-changed')) {
        $reason = 'native-capture-unavailable'
    }
    $receipt = @{ status = 'skipped'; reason = $reason; capture = 'uia-only';
        screenshot = 'not-captured'; permissionGrantAttempted = $false }
} finally {
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 6))
}
