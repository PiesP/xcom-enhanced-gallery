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

# Exact Chrome ko-KR UIA names from the owned permission prompt; keep this file ASCII for Windows PowerShell 5.1 -File.
$script:PermissionTitle = "'Tampermonkey'" + [string]::Concat([char[]]@(
    0xC774,0x0028,0xAC00,0x0029,0x0020,0xCD94,0xAC00,0x0020,0xC2B9,0xC778,
    0xC744,0x0020,0xC694,0xCCAD,0xD588,0xC2B5,0xB2C8,0xB2E4,0x002E))
$script:PriorPermissionsLabel = [string]::Concat([char[]]@(
    0xC774,0xC804,0xC5D0,0x0020,0xAC00,0xB2A5,0xD588,0xB358,0x0020,0xB300,0xC0C1,0x003A))
$script:DownloadsPermissionLabel = [string]::Concat([char[]]@(
    0xB2E4,0xC6B4,0xB85C,0xB4DC,0x0020,0xAD00,0xB9AC))
$script:AllowButtonLabel = [string]::Concat([char[]]@(0xD5C8,0xC6A9))
$script:DenyButtonLabel = [string]::Concat([char[]]@(0xAC70,0xBD80))

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

function Get-PromptInspection {
    param([Windows.Automation.AutomationElement]$Prompt, [int]$ExpectedPid)
    if ($Prompt.Current.ProcessId -ne $ExpectedPid -or
        $Prompt.Current.ControlType.ProgrammaticName -cne 'ControlType.Window' -or
        $Prompt.Current.Name -cne $script:PermissionTitle -or
        $Prompt.Current.IsOffscreen) { throw 'prompt-identity-changed' }
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@($Prompt, 0))
    $visited = 0
    $controls = New-Object System.Collections.ArrayList
    $allow = New-Object System.Collections.ArrayList
    $deny = New-Object System.Collections.ArrayList
    $nameTruncated = $false
    while ($queue.Count -gt 0 -and $visited -lt 128) {
        $entry = $queue.Dequeue()
        $element = $entry[0]
        $depth = [int]$entry[1]
        $visited++
        $current = $element.Current
        if ($current.ProcessId -ne $ExpectedPid) { throw 'prompt-process-mismatch' }
        $name = [string]$current.Name
        $type = [string]$current.ControlType.ProgrammaticName
        if ($name.Length -gt 120 -or $type.Length -gt 80) { $nameTruncated = $true }
        [void]$controls.Add(@{ depth = $depth; rawName = $name; rawType = $type;
            name = $name.Substring(0, [Math]::Min(120, $name.Length));
            controlType = $type.Substring(0, [Math]::Min(80, $type.Length));
            isEnabled = [bool]$current.IsEnabled; isOffscreen = [bool]$current.IsOffscreen })
        if ($type -eq 'ControlType.Button') {
            if ($name -ceq $script:AllowButtonLabel) { [void]$allow.Add($element) }
            if ($name -ceq $script:DenyButtonLabel) { [void]$deny.Add($element) }
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
    if ($queue.Count -gt 0) { throw 'prompt-traversal-truncated' }
    $serialized = @($controls | ForEach-Object {
        @{ depth = $_.depth; name = $_.name; controlType = $_.controlType;
            isEnabled = $_.isEnabled; isOffscreen = $_.isOffscreen }
    })
    return @{ controls = $serialized; rawControls = @($controls.ToArray());
        allowElements = @($allow.ToArray()); denyElements = @($deny.ToArray());
        visitedControls = $visited; nameTruncated = $nameTruncated;
        rootProcessId = [int]$Prompt.Current.ProcessId; complete = (-not $nameTruncated) }
}

function Get-PromptAction {
    param($Inspection)
    if (-not $Inspection.complete -or $Inspection.nameTruncated) {
        throw 'prompt-traversal-truncated'
    }
    $download = 0
    $titleText = 0
    $previouslyAllowed = 0
    $titleWindow = 0
    foreach ($control in $Inspection.rawControls) {
        $name = $control.rawName
        $type = $control.rawType
        if ($name.Length -gt 0 -and $name -cnotin @(
            $script:PermissionTitle, $script:PriorPermissionsLabel,
            $script:DownloadsPermissionLabel, $script:AllowButtonLabel,
            $script:DenyButtonLabel)) { throw 'prompt-has-other-named-control' }
        if ($type -ceq 'ControlType.Window' -and $name -ceq $script:PermissionTitle) {
            $titleWindow++
        }
        if ($type -ceq 'ControlType.Text' -and $name.Length -gt 0) {
            if ($name -ceq $script:PermissionTitle) { $titleText++ }
            elseif ($name -ceq $script:PriorPermissionsLabel) { $previouslyAllowed++ }
            elseif ($name -ceq $script:DownloadsPermissionLabel) { $download++ }
            else { throw 'prompt-has-other-permission-text' }
        }
    }
    if ($titleWindow -ne 1 -or $download -ne 1 -or $titleText -ne 1 -or
        $previouslyAllowed -ne 1 -or $Inspection.allowElements.Count -ne 1 -or
        $Inspection.denyElements.Count -ne 1) { throw 'prompt-controls-not-unique' }
    $allow = $Inspection.allowElements[0]
    $deny = $Inspection.denyElements[0]
    if (-not $allow.Current.IsEnabled -or $allow.Current.IsOffscreen -or
        -not $deny.Current.IsEnabled -or $deny.Current.IsOffscreen) {
        throw 'prompt-buttons-not-visible-enabled'
    }
    return $allow
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
    $globalTruncated = $false
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
                $name -ceq $script:PermissionTitle) {
                [void]$promptWindows.Add($element)
            }
            if ($depth -ge 8) {
                if ($null -ne $walker.GetFirstChild($element)) { $globalTruncated = $true }
                continue
            }
            $child = $walker.GetFirstChild($element)
            $siblings = 0
            while ($null -ne $child -and $siblings -lt 64 -and $queue.Count -lt 256) {
                $queue.Enqueue(@($child, ($depth + 1)))
                $siblings++
                $child = $walker.GetNextSibling($child)
            }
            if ($null -ne $child) { $globalTruncated = $true }
        } catch { throw 'uia-inspection-unavailable' }
    }
    if ($controls.Count -eq 0) { throw 'uia-inspection-empty' }
    $promptScope = @{ complete = $false; windowCount = $promptWindows.Count;
        controls = @(); visitedControls = 0; rootProcessId = $null; nameTruncated = $false }
    if ($promptWindows.Count -eq 1) {
        $inspection = Get-PromptInspection -Prompt $promptWindows[0] -ExpectedPid $BrowserPid
        $promptScope = @{ complete = $inspection.complete; windowCount = 1;
            controls = $inspection.controls; visitedControls = $inspection.visitedControls;
            rootProcessId = $inspection.rootProcessId;
            nameTruncated = $inspection.nameTruncated }
    }
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
        truncated = ($globalTruncated -or $queue.Count -gt 0);
        promptScope = $promptScope }
    if ($InvokeAllow) {
        $receipt.permissionGrantAttempted = $false
        if ($BrowserName -ne 'chrome' -or
            $ExpectedCreationUtcTicks -cne $receipt.creationUtcTicks -or
            $ExpectedSessionId -ne $receipt.browserSessionId -or
            $ExpectedForegroundHandle -cne $receipt.foregroundHandle -or
            -not $promptScope.complete -or $promptWindows.Count -ne 1) {
            throw 'action-identity-or-prompt-mismatch'
        }
        $actionInspection = Get-PromptInspection -Prompt $promptWindows[0] -ExpectedPid $BrowserPid
        $allow = Get-PromptAction -Inspection $actionInspection
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
