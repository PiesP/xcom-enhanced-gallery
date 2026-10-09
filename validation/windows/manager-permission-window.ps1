# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
# UIA evidence and one guarded native Chrome permission action in the task browser.
param(
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$BrowserPid,
    [Parameter(Mandatory=$true)][ValidateSet('chrome','msedge')][string]$BrowserName,
    [Parameter(Mandatory=$true)][string]$Profile,
    [Parameter(Mandatory=$true)][string]$Output,
    [switch]$InvokeAllow,
    [string]$ExpectedCreationUtcTicks,
    [int]$ExpectedSessionId,
    [string]$ExpectedForegroundHandle
)
$ErrorActionPreference = 'Stop'
$receiptPath = Join-Path $Output $(if ($InvokeAllow) {
    'userscript-manager-native-permission-action.json'
} else { 'userscript-manager-native-permission.json' })
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

function Get-PromptAction {
    param([Windows.Automation.AutomationElement]$Prompt, [int]$ExpectedPid)
    if ($Prompt.Current.ProcessId -ne $ExpectedPid -or
        $Prompt.Current.ControlType.ProgrammaticName -cne 'ControlType.Window' -or
        $Prompt.Current.Name -cne "'Tampermonkey'이(가) 추가 승인을 요청했습니다." -or
        $Prompt.Current.IsOffscreen) { throw 'prompt-identity-changed' }
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@($Prompt, 0))
    $visited = 0
    $allow = New-Object System.Collections.ArrayList
    $deny = New-Object System.Collections.ArrayList
    $download = 0
    $titleText = 0
    $previouslyAllowed = 0
    while ($queue.Count -gt 0 -and $visited -lt 128) {
        $entry = $queue.Dequeue()
        $element = $entry[0]
        $depth = [int]$entry[1]
        $visited++
        $current = $element.Current
        if ($current.ProcessId -ne $ExpectedPid) { throw 'prompt-process-mismatch' }
        $name = [string]$current.Name
        $type = [string]$current.ControlType.ProgrammaticName
        if ($name.Length -gt 0 -and $name -cnotin @(
            "'Tampermonkey'이(가) 추가 승인을 요청했습니다.", '이전에 가능했던 대상:',
            '다운로드 관리', '허용', '거부')) { throw 'prompt-has-other-named-control' }
        if ($type -eq 'ControlType.Text' -and $name.Length -gt 0) {
            switch -CaseSensitive ($name) {
                "'Tampermonkey'이(가) 추가 승인을 요청했습니다." { $titleText++ }
                '이전에 가능했던 대상:' { $previouslyAllowed++ }
                '다운로드 관리' { $download++ }
                default { throw 'prompt-has-other-permission-text' }
            }
        }
        if ($type -eq 'ControlType.Button') {
            if ($name -ceq '허용') { [void]$allow.Add($element) }
            if ($name -ceq '거부') { [void]$deny.Add($element) }
        }
        if ($depth -ge 8) {
            if ($null -ne $walker.GetFirstChild($element)) { throw 'prompt-traversal-truncated' }
            continue
        }
        $child = $walker.GetFirstChild($element)
        $siblings = 0
        while ($null -ne $child -and $siblings -lt 64 -and $queue.Count -lt 128) {
            $queue.Enqueue(@($child, ($depth + 1)))
            $siblings++
            $child = $walker.GetNextSibling($child)
        }
        if ($null -ne $child) { throw 'prompt-traversal-truncated' }
    }
    if ($queue.Count -gt 0 -or $download -ne 1 -or $titleText -ne 1 -or
        $previouslyAllowed -ne 1 -or $allow.Count -ne 1 -or $deny.Count -ne 1) {
        throw 'prompt-controls-not-unique'
    }
    if (-not $allow[0].Current.IsEnabled -or $allow[0].Current.IsOffscreen -or
        -not $deny[0].Current.IsEnabled -or $deny[0].Current.IsOffscreen) {
        throw 'prompt-buttons-not-visible-enabled'
    }
    return $allow[0]
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
    $promptWindows = New-Object System.Collections.ArrayList
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
            if ($type -eq 'ControlType.Window' -and
                $name -ceq "'Tampermonkey'이(가) 추가 승인을 요청했습니다.") {
                [void]$promptWindows.Add($element)
            }
            if ($depth -ge 8) { continue }
            $child = $walker.GetFirstChild($element)
            $siblings = 0
            while ($null -ne $child -and $siblings -lt 64 -and $queue.Count -lt 256) {
                $queue.Enqueue(@($child, ($depth + 1)))
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
        creationUtcTicks = ([datetime]$before.CreationDate).ToUniversalTime().Ticks.ToString();
        browserSessionId = [int]$before.SessionId;
        observerSessionId = [Diagnostics.Process]::GetCurrentProcess().SessionId;
        foregroundHandle = $foreground.ToInt64().ToString();
        foregroundOwnedAndVisible = $foregroundOwnedAndVisible;
        uiaRootProcessId = [int]$root.Current.ProcessId;
        windowCount = $windows.Count;
        controls = @($controls.ToArray()); visitedControls = $visited;
        truncated = ($queue.Count -gt 0) }
    if ($InvokeAllow) {
        $receipt.permissionGrantAttempted = $false
        if ($BrowserName -ne 'chrome' -or
            $ExpectedCreationUtcTicks -cne $receipt.creationUtcTicks -or
            $ExpectedSessionId -ne $receipt.browserSessionId -or
            $ExpectedForegroundHandle -cne $receipt.foregroundHandle -or
            $queue.Count -gt 0 -or $promptWindows.Count -ne 1) {
            throw 'action-identity-or-prompt-mismatch'
        }
        $allow = Get-PromptAction -Prompt $promptWindows[0] -ExpectedPid $BrowserPid
        $justBefore = Test-OwnedProcess
        if ($justBefore.CreationDate -ne $before.CreationDate -or
            [XegPermissionWindow]::GetForegroundWindow() -ne $foreground -or
            -not [XegPermissionWindow]::IsOwned($foreground, [uint32]$BrowserPid) -or
            $allow.Current.ProcessId -ne $BrowserPid -or
            -not $allow.Current.IsEnabled -or $allow.Current.IsOffscreen) {
            throw 'action-identity-changed-before-invoke'
        }
        $pattern = $allow.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
        if ($null -eq $pattern) { throw 'allow-invoke-pattern-unavailable' }
        $receipt.permissionGrantAttempted = $true
        $pattern.Invoke()
        $receipt.status = 'invoked'
        $afterInvoke = Test-OwnedProcess
        $receipt.postBrowserPid = [int]$afterInvoke.ProcessId
        $receipt.postCreationUtcTicks = ([datetime]$afterInvoke.CreationDate).ToUniversalTime().Ticks.ToString()
        $receipt.postSessionId = [int]$afterInvoke.SessionId
        $receipt.postProcessStable = ($afterInvoke.CreationDate -eq $before.CreationDate)
        $newForeground = [XegPermissionWindow]::GetForegroundWindow()
        $receipt.postForegroundHandle = $newForeground.ToInt64().ToString()
        $receipt.postForegroundOwned = [XegPermissionWindow]::IsOwned($newForeground,
            [uint32]$BrowserPid)
        if (-not $receipt.postProcessStable -or -not $receipt.postForegroundOwned) {
            $receipt.status = 'unverified-after-invoke'
        }
    }
} catch {
    $reason = [string]$_.Exception.Message
    if ($reason -notin @('browser-process-unavailable','browser-executable-unverified',
        'browser-profile-unverified','browser-session-unverified','window-enumeration-limit',
        'owned-window-not-foreground',
        'uia-root-unverified','uia-inspection-unavailable','uia-inspection-empty',
        'window-identity-changed','action-identity-or-prompt-mismatch',
        'prompt-identity-changed','prompt-process-mismatch','prompt-has-other-named-control',
        'prompt-has-other-permission-text','prompt-traversal-truncated',
        'prompt-controls-not-unique','prompt-buttons-not-visible-enabled',
        'action-identity-changed-before-invoke','allow-invoke-pattern-unavailable')) {
        $reason = 'native-capture-unavailable'
    }
    $receipt.status = $(if ($receipt.permissionGrantAttempted) { 'unverified-after-invoke' }
        else { 'skipped' })
    $receipt.reason = $reason
} finally {
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 6))
}
