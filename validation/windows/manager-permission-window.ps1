# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
# UIA evidence and one guarded native permission action in the task browser.
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

# Exact ko-KR UIA names from owned Chrome and Edge permission prompts; keep this file ASCII for Windows PowerShell 5.1 -File.
$script:ChromePermissionTitle = "'Tampermonkey'" + [string]::Concat([char[]]@(
    0xC774,0x0028,0xAC00,0x0029,0x0020,0xCD94,0xAC00,0x0020,0xC2B9,0xC778,
    0xC744,0x0020,0xC694,0xCCAD,0xD588,0xC2B5,0xB2C8,0xB2E4,0x002E))
$script:EdgePermissionTitle = [string]::Concat([char[]]@(
    0x0022,0x0054,0x0061,0x006D,0x0070,0x0065,0x0072,0x006D,0x006F,0x006E,
    0x006B,0x0065,0x0079,0x0022,0x0020,0xC774,0x0028,0xAC00,0x0029,0x0020,
    0xC0AC,0xC6A9,0x0020,0xAD8C,0xD55C,0xC744,0x0020,0xC694,0xCCAD,
    0xD588,0xC2B5,0xB2C8,0xB2E4,0x002E))
$script:PermissionTitle = $(if ($BrowserName -eq 'msedge') {
    $script:EdgePermissionTitle
} else { $script:ChromePermissionTitle })
$script:ChromePriorPermissionsLabel = [string]::Concat([char[]]@(
    0xC774,0xC804,0xC5D0,0x0020,0xAC00,0xB2A5,0xD588,0xB358,0x0020,0xB300,0xC0C1,0x003A))
$script:ChromeDownloadsPermissionLabel = [string]::Concat([char[]]@(
    0xB2E4,0xC6B4,0xB85C,0xB4DC,0x0020,0xAD00,0xB9AC))
$script:EdgePriorPermissionsLabel = [string]::Concat([char[]]@(
    0xD655,0xC7A5,0xC740,0x0020,0xB2E4,0xC74C,0xC744,0x0020,0xD560,
    0x0020,0xC218,0x0020,0xC788,0xC2B5,0xB2C8,0xB2E4,0x002E))
$script:EdgeDownloadsPermissionLabel = [string]::Concat([char[]]@(
    0x2022,0x0020,0xB2E4,0xC6B4,0xB85C,0xB4DC,0x0020,0xAD00,0xB9AC))
$script:PriorPermissionsLabel = $(if ($BrowserName -eq 'msedge') {
    $script:EdgePriorPermissionsLabel
} else { $script:ChromePriorPermissionsLabel })
$script:DownloadsPermissionLabel = $(if ($BrowserName -eq 'msedge') {
    $script:EdgeDownloadsPermissionLabel
} else { $script:ChromeDownloadsPermissionLabel })
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
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
    public static uint ProcessIdOf(IntPtr hwnd) {
        uint pid;
        return hwnd != IntPtr.Zero && GetWindowThreadProcessId(hwnd, out pid) != 0 ? pid : 0;
    }
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
    $queue = New-Object System.Collections.Queue
    $visited = 0
    $controls = New-Object System.Collections.ArrayList
    $allow = New-Object System.Collections.ArrayList
    $deny = New-Object System.Collections.ArrayList
    $seen = [Collections.Generic.HashSet[string]]::new()
    $reason = $null
    $rootProcessId = $null
    try {
        $currentRoot = $Prompt.Current
        $rootProcessId = [int]$currentRoot.ProcessId
        if ($rootProcessId -ne $ExpectedPid -or
            $currentRoot.ControlType.ProgrammaticName -cne 'ControlType.Window' -or
            $currentRoot.Name -cne $script:PermissionTitle -or
            $currentRoot.IsOffscreen) { $reason = 'prompt-identity-changed' }
    } catch { $reason = 'provider-error' }
    if ($null -eq $reason) { $queue.Enqueue(@($Prompt, 0)) }
    while ($queue.Count -gt 0 -and $visited -lt 128 -and $null -eq $reason) {
        $entry = $queue.Dequeue()
        $element = $entry[0]
        $depth = [int]$entry[1]
        $visited++
        try {
            $runtimeId = $element.GetRuntimeId()
            if ($null -eq $runtimeId -or $runtimeId.Length -eq 0) {
                $reason = 'runtime-id-unavailable'; break
            }
            if (-not $seen.Add(($runtimeId -join ','))) {
                $reason = 'duplicate-runtime-id'; break
            }
            $current = $element.Current
            if ($current.ProcessId -ne $ExpectedPid) { $reason = 'cross-process'; break }
            $name = [string]$current.Name
            $type = [string]$current.ControlType.ProgrammaticName
            [void]$controls.Add(@{ depth = $depth; rawName = $name; rawType = $type;
                name = $name.Substring(0, [Math]::Min(120, $name.Length));
                controlType = $type.Substring(0, [Math]::Min(80, $type.Length));
                isEnabled = [bool]$current.IsEnabled; isOffscreen = [bool]$current.IsOffscreen })
            if ($name.Length -gt 120 -or $type.Length -gt 80) { $reason = 'name-cap'; break }
            if ($type -eq 'ControlType.Button') {
                if ($name -ceq $script:AllowButtonLabel) { [void]$allow.Add($element) }
                if ($name -ceq $script:DenyButtonLabel) { [void]$deny.Add($element) }
            }
            if ($depth -ge 16) {
                if ($null -ne $walker.GetFirstChild($element)) { $reason = 'depth-cap' }
                continue
            }
            $child = $walker.GetFirstChild($element)
            $siblings = 0
            while ($null -ne $child -and $siblings -lt 64 -and $queue.Count -lt 128) {
                $queue.Enqueue(@($child, ($depth + 1)))
                $siblings++
                $child = $walker.GetNextSibling($child)
            }
            if ($null -ne $child) {
                $reason = $(if ($siblings -ge 64) { 'sibling-cap' } else { 'node-cap' })
            }
        } catch { $reason = 'provider-error' }
    }
    if ($null -eq $reason -and $queue.Count -gt 0) { $reason = 'node-cap' }
    $serialized = @($controls | ForEach-Object {
        @{ depth = $_.depth; name = $_.name; controlType = $_.controlType;
            isEnabled = $_.isEnabled; isOffscreen = $_.isOffscreen }
    })
    return @{ controls = $serialized; rawControls = @($controls.ToArray());
        allowElements = @($allow.ToArray()); denyElements = @($deny.ToArray());
        visitedControls = $controls.Count; attemptedNodes = $visited;
        nameTruncated = ($reason -eq 'name-cap');
        rootProcessId = $rootProcessId; complete = ($null -eq $reason);
        reason = $reason }
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

function Test-EdgeRefocusEligibility {
    param(
        [string]$CandidateBrowserName,
        [bool]$CandidateInvokeAllow,
        [int]$CandidateBrowserPid,
        [string]$ExpectedCreation,
        [string]$ActualCreation,
        [int]$ExpectedSession,
        [int]$ActualSession,
        [string]$ExpectedHandle,
        [string]$OriginalHandle,
        [string]$CurrentHandle,
        [int]$CurrentPid,
        [bool]$SameCreation,
        [bool]$OriginalOwned,
        [bool]$CurrentOwned,
        [string]$WindowEnumeration,
        [string[]]$OwnedVisibleHandles,
        [bool]$PromptComplete,
        [bool]$PromptNameTruncated,
        [int]$PromptWindowCount
    )
    return ($CandidateBrowserName -ceq 'msedge' -and $CandidateInvokeAllow -and
        $CandidateBrowserPid -gt 0 -and $SameCreation -and
        $ExpectedCreation -ceq $ActualCreation -and
        $ExpectedSession -gt 0 -and $ExpectedSession -eq $ActualSession -and
        $ExpectedHandle -ceq $OriginalHandle -and
        $OriginalHandle -cne $CurrentHandle -and
        $CurrentPid -eq $CandidateBrowserPid -and
        $OriginalOwned -and $CurrentOwned -and
        $WindowEnumeration -ceq 'complete' -and
        $OwnedVisibleHandles.Count -gt 0 -and $OwnedVisibleHandles.Count -le 8 -and
        $OwnedVisibleHandles -ccontains $OriginalHandle -and
        $OwnedVisibleHandles -ccontains $CurrentHandle -and
        $PromptComplete -and -not $PromptNameTruncated -and
        $PromptWindowCount -eq 1)
}

function Invoke-OneTimeEdgePromptRefocus {
    param(
        [ValidateSet('initial','final')][string]$Phase,
        [IntPtr]$OriginalForeground,
        [IntPtr]$CurrentForeground,
        $OriginalProcess,
        $CurrentProcess,
        $PromptInspection,
        $PromptScope,
        [int]$PromptWindowCount,
        [string]$WindowEnumeration,
        [IntPtr[]]$OwnedWindows,
        [hashtable]$Receipt,
        [bool]$AlreadyAttempted
    )
    if ($AlreadyAttempted) {
        $Receipt.edgeRefocusRepeat = @{ phase = $Phase; status = 'already-attempted' }
        return @{ restored = $false; process = $CurrentProcess;
            foreground = $CurrentForeground }
    }
    $candidate = @{
        CandidateBrowserName = $BrowserName;
        CandidateInvokeAllow = [bool]$InvokeAllow;
        CandidateBrowserPid = $BrowserPid;
        ExpectedCreation = $ExpectedCreationUtcTicks;
        ActualCreation = ([datetime]$CurrentProcess.CreationDate).ToUniversalTime().Ticks.ToString();
        ExpectedSession = $ExpectedSessionId;
        ActualSession = [int]$CurrentProcess.SessionId;
        ExpectedHandle = $ExpectedForegroundHandle;
        OriginalHandle = $OriginalForeground.ToInt64().ToString();
        CurrentHandle = $CurrentForeground.ToInt64().ToString();
        CurrentPid = [XegPermissionWindow]::ProcessIdOf($CurrentForeground);
        SameCreation = ($OriginalProcess.CreationDate -eq $CurrentProcess.CreationDate);
        OriginalOwned = [XegPermissionWindow]::IsOwned($OriginalForeground, [uint32]$BrowserPid);
        CurrentOwned = [XegPermissionWindow]::IsOwned($CurrentForeground, [uint32]$BrowserPid);
        WindowEnumeration = $WindowEnumeration;
        OwnedVisibleHandles = @($OwnedWindows | ForEach-Object { $_.ToInt64().ToString() });
        PromptComplete = [bool]$PromptScope.complete;
        PromptNameTruncated = [bool]$PromptScope.nameTruncated;
        PromptWindowCount = $PromptWindowCount
    }
    $eligible = Test-EdgeRefocusEligibility @candidate
    $Receipt.edgeRefocus = @{ phase = $Phase; status = 'ineligible'; eligible = $eligible;
        setForegroundWindowReturned = $null; exactPromptValidatedBeforeRefocus = $false;
        before = @{ creationUtcTicks = $candidate.ActualCreation;
            foregroundHandle = $candidate.CurrentHandle;
            foregroundPid = $candidate.CurrentPid;
            originalHandle = $candidate.OriginalHandle } }
    if (-not $eligible) {
        return @{ restored = $false; process = $CurrentProcess;
            foreground = $CurrentForeground }
    }
    $Receipt.edgeRefocus.status = 'checking-prompt'
    try {
        [void](Get-PromptAction -Inspection $PromptInspection)
    } catch {
        $Receipt.edgeRefocus.status = 'prompt-rejected'
        throw
    }
    $Receipt.edgeRefocus.exactPromptValidatedBeforeRefocus = $true
    $preRefocus = Test-OwnedProcess
    $preRefocusForeground = [XegPermissionWindow]::GetForegroundWindow()
    $Receipt.edgeRefocus.preRefocus = @{
        creationUtcTicks = ([datetime]$preRefocus.CreationDate).ToUniversalTime().Ticks.ToString();
        browserSessionId = [int]$preRefocus.SessionId;
        foregroundHandle = $preRefocusForeground.ToInt64().ToString();
        originalOwned = [XegPermissionWindow]::IsOwned($OriginalForeground, [uint32]$BrowserPid);
        currentOwned = [XegPermissionWindow]::IsOwned($preRefocusForeground,
            [uint32]$BrowserPid)
    }
    if ($preRefocus.CreationDate -ne $OriginalProcess.CreationDate -or
        $ExpectedCreationUtcTicks -cne $Receipt.edgeRefocus.preRefocus.creationUtcTicks -or
        $ExpectedSessionId -ne $preRefocus.SessionId -or
        $ExpectedForegroundHandle -cne $OriginalForeground.ToInt64().ToString() -or
        $preRefocusForeground -ne $CurrentForeground -or
        -not $Receipt.edgeRefocus.preRefocus.originalOwned -or
        -not $Receipt.edgeRefocus.preRefocus.currentOwned) {
        $Receipt.edgeRefocus.status = 'pre-check-failed'
        throw 'edge-refocus-identity-changed'
    }
    $Receipt.edgeRefocus.status = 'attempted'
    $refocusReturned = [XegPermissionWindow]::SetForegroundWindow($OriginalForeground)
    $Receipt.edgeRefocus.setForegroundWindowReturned = $refocusReturned
    if (-not $refocusReturned) {
        $Receipt.edgeRefocus.status = 'api-rejected'
        throw 'edge-refocus-failed'
    }
    $after = Test-OwnedProcess
    $afterForeground = [XegPermissionWindow]::GetForegroundWindow()
    $sameCreation = ($OriginalProcess.CreationDate -eq $after.CreationDate)
    $sameForeground = ($afterForeground -eq $OriginalForeground)
    $originalOwned = [XegPermissionWindow]::IsOwned($OriginalForeground, [uint32]$BrowserPid)
    $Receipt.edgeRefocus.after = @{
        creationUtcTicks = ([datetime]$after.CreationDate).ToUniversalTime().Ticks.ToString();
        browserSessionId = [int]$after.SessionId;
        foregroundHandle = $afterForeground.ToInt64().ToString();
        foregroundPid = [XegPermissionWindow]::ProcessIdOf($afterForeground);
        foregroundOwned = $originalOwned;
        sameCreation = $sameCreation;
        sameForeground = $sameForeground
    }
    if (-not $sameCreation -or -not $sameForeground -or
        -not $originalOwned -or
        $ExpectedCreationUtcTicks -cne $Receipt.edgeRefocus.after.creationUtcTicks -or
        $ExpectedSessionId -ne $after.SessionId -or
        $ExpectedForegroundHandle -cne $afterForeground.ToInt64().ToString()) {
        $Receipt.edgeRefocus.status = 'post-check-failed'
        throw 'edge-refocus-identity-changed'
    }
    $Receipt.edgeRefocus.status = 'restored'
    return @{ restored = $true; process = $after; foreground = $afterForeground }
}

function Get-FinalInvokeIdentity {
    param($OriginalProcess, [IntPtr]$OriginalForeground, $Allow)
    $process = Test-OwnedProcess
    $windows = @()
    $enumeration = 'complete'
    try {
        $windows = @([XegPermissionWindow]::OwnedVisibleWindows([uint32]$BrowserPid))
    } catch {
        $enumeration = 'unavailable'
    }
    $allowCurrent = $Allow.Current
    $currentForeground = [XegPermissionWindow]::GetForegroundWindow()
    return @{
        process = $process;
        foreground = $currentForeground;
        windows = $windows;
        enumeration = $enumeration;
        sameCreation = ($process.CreationDate -eq $OriginalProcess.CreationDate);
        sameForeground = ($currentForeground -eq $OriginalForeground);
        originalOwned = [XegPermissionWindow]::IsOwned($OriginalForeground,
            [uint32]$BrowserPid);
        currentOwned = [XegPermissionWindow]::IsOwned($currentForeground,
            [uint32]$BrowserPid);
        allowProcessId = [int]$allowCurrent.ProcessId;
        allowEnabled = [bool]$allowCurrent.IsEnabled;
        allowOffscreen = [bool]$allowCurrent.IsOffscreen;
        diagnostic = @{
            expectedBrowserPid = $BrowserPid;
            browserPid = [int]$process.ProcessId;
            expectedCreationUtcTicks = $ExpectedCreationUtcTicks;
            originalCreationUtcTicks = ([datetime]$OriginalProcess.CreationDate).ToUniversalTime().Ticks.ToString();
            currentCreationUtcTicks = ([datetime]$process.CreationDate).ToUniversalTime().Ticks.ToString();
            sameCreation = ($process.CreationDate -eq $OriginalProcess.CreationDate);
            expectedSessionId = $ExpectedSessionId;
            browserSessionId = [int]$process.SessionId;
            expectedForegroundHandle = $ExpectedForegroundHandle;
            originalForegroundHandle = $OriginalForeground.ToInt64().ToString();
            currentForegroundHandle = $currentForeground.ToInt64().ToString();
            sameForeground = ($currentForeground -eq $OriginalForeground);
            currentForegroundPid = [XegPermissionWindow]::ProcessIdOf($currentForeground);
            originalOwned = [XegPermissionWindow]::IsOwned($OriginalForeground,
                [uint32]$BrowserPid);
            currentOwned = [XegPermissionWindow]::IsOwned($currentForeground,
                [uint32]$BrowserPid);
            ownedVisibleWindowEnumeration = $enumeration;
            ownedVisibleWindowCount = $(if ($enumeration -eq 'complete') { $windows.Count } else { $null });
            ownedVisibleHandles = @($windows | ForEach-Object { $_.ToInt64().ToString() });
            allowProcessId = [int]$allowCurrent.ProcessId;
            allowEnabled = [bool]$allowCurrent.IsEnabled;
            allowOffscreen = [bool]$allowCurrent.IsOffscreen
        }
    }
}

function Test-FinalInvokeIdentity {
    param($State, [int]$ExpectedPid)
    return ($State.sameCreation -and $State.sameForeground -and $State.originalOwned -and
        $State.allowProcessId -eq $ExpectedPid -and $State.allowEnabled -and
        -not $State.allowOffscreen)
}

function Test-FinalEdgeRefocusCandidate {
    param($State, [string]$CandidateBrowserName, [int]$ExpectedPid,
        [bool]$AlreadyAttempted)
    return ($CandidateBrowserName -ceq 'msedge' -and -not $AlreadyAttempted -and
        $State.sameCreation -and -not $State.sameForeground -and
        $State.originalOwned -and $State.currentOwned -and
        $State.enumeration -ceq 'complete' -and
        $State.allowProcessId -eq $ExpectedPid -and $State.allowEnabled -and
        -not $State.allowOffscreen)
}

try {
    $before = Test-OwnedProcess
    $windows = [XegPermissionWindow]::OwnedVisibleWindows([uint32]$BrowserPid)
    $foreground = [XegPermissionWindow]::GetForegroundWindow()
    $windowOwnership = @{
        browserPid = [int]$before.ProcessId;
        creationUtcTicks = ([datetime]$before.CreationDate).ToUniversalTime().Ticks.ToString();
        browserSessionId = [int]$before.SessionId;
        observerSessionId = [Diagnostics.Process]::GetCurrentProcess().SessionId;
        ownedVisibleWindowCount = $windows.Count;
        ownedVisibleHandles = @($windows | ForEach-Object { $_.ToInt64().ToString() });
        foregroundHandle = $foreground.ToInt64().ToString();
        foregroundPid = [XegPermissionWindow]::ProcessIdOf($foreground);
        foregroundIsOwned = [bool]($windows -contains $foreground)
    }
    $receipt.windowOwnership = $windowOwnership
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
        controls = @(); visitedControls = 0; attemptedNodes = 0;
        rootProcessId = $null; nameTruncated = $false;
        reason = 'prompt-window-not-unique' }
    if ($promptWindows.Count -eq 1) {
        $inspection = Get-PromptInspection -Prompt $promptWindows[0] -ExpectedPid $BrowserPid
        $promptScope = @{ complete = $inspection.complete; windowCount = 1;
            controls = $inspection.controls; visitedControls = $inspection.visitedControls;
            attemptedNodes = $inspection.attemptedNodes; reason = $inspection.reason;
            rootProcessId = $inspection.rootProcessId;
            nameTruncated = $inspection.nameTruncated }
    }
    $receipt.promptScope = $promptScope
    $after = Test-OwnedProcess
    $afterForeground = [XegPermissionWindow]::GetForegroundWindow()
    $foregroundOwnedAndVisible = [XegPermissionWindow]::IsOwned($foreground, [uint32]$BrowserPid)
    $sameCreation = ($before.CreationDate -eq $after.CreationDate)
    $sameForeground = ($afterForeground -eq $foreground)
    $afterWindows = @()
    $afterWindowEnumeration = 'complete'
    try {
        $afterWindows = @([XegPermissionWindow]::OwnedVisibleWindows([uint32]$BrowserPid))
    } catch {
        $afterWindowEnumeration = 'unavailable'
    }
    $receipt.identityRecheck = @{
        beforeCreationUtcTicks = ([datetime]$before.CreationDate).ToUniversalTime().Ticks.ToString();
        afterCreationUtcTicks = ([datetime]$after.CreationDate).ToUniversalTime().Ticks.ToString();
        sameCreation = $sameCreation;
        beforeForegroundHandle = $foreground.ToInt64().ToString();
        afterForegroundHandle = $afterForeground.ToInt64().ToString();
        sameForeground = $sameForeground;
        afterForegroundPid = [XegPermissionWindow]::ProcessIdOf($afterForeground);
        afterForegroundOwned = [XegPermissionWindow]::IsOwned($afterForeground, [uint32]$BrowserPid);
        originalForegroundOwnedAndVisible = $foregroundOwnedAndVisible;
        ownedVisibleWindowEnumeration = $afterWindowEnumeration;
        ownedVisibleWindowCount = $(if ($afterWindowEnumeration -eq 'complete') { $afterWindows.Count } else { $null });
        ownedVisibleHandles = @($afterWindows | ForEach-Object { $_.ToInt64().ToString() })
    }
    $refocusAttempted = $false
    if ((-not $sameCreation -or -not $sameForeground -or
            -not $foregroundOwnedAndVisible) -and
        $InvokeAllow -and $BrowserName -ceq 'msedge') {
        $refocusArgs = @{
            Phase = 'initial'; OriginalForeground = $foreground;
            CurrentForeground = $afterForeground; OriginalProcess = $before;
            CurrentProcess = $after; PromptInspection = $inspection;
            PromptScope = $promptScope; PromptWindowCount = $promptWindows.Count;
            WindowEnumeration = $afterWindowEnumeration; OwnedWindows = $afterWindows;
            Receipt = $receipt; AlreadyAttempted = $refocusAttempted
        }
        $refocus = Invoke-OneTimeEdgePromptRefocus @refocusArgs
        $refocusAttempted = [bool]$refocus.restored
        $after = $refocus.process
        $afterForeground = $refocus.foreground
        $foregroundOwnedAndVisible = [XegPermissionWindow]::IsOwned($foreground,
            [uint32]$BrowserPid)
        $sameCreation = ($before.CreationDate -eq $after.CreationDate)
        $sameForeground = ($afterForeground -eq $foreground)
    }
    if (-not $sameCreation -or -not $sameForeground -or
        -not $foregroundOwnedAndVisible) {
        throw 'window-identity-changed'
    }
    $recheckReceipt = $receipt
    $receipt = @{ status = 'captured'; capture = 'uia-only'; screenshot = 'not-captured';
        permissionGrantAttempted = $false;
        windowOwnership = $windowOwnership;
        identityRecheck = $recheckReceipt.identityRecheck;
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
    if ($recheckReceipt.ContainsKey('edgeRefocus')) {
        $receipt.edgeRefocus = $recheckReceipt.edgeRefocus
    }
    if ($InvokeAllow) {
        $receipt.permissionGrantAttempted = $false
        if ($ExpectedCreationUtcTicks -cne $receipt.creationUtcTicks -or
            $ExpectedSessionId -ne $receipt.browserSessionId -or
            $ExpectedForegroundHandle -cne $receipt.foregroundHandle -or
            -not $promptScope.complete -or $promptWindows.Count -ne 1) {
            throw 'action-identity-or-prompt-mismatch'
        }
        $actionInspection = Get-PromptInspection -Prompt $promptWindows[0] -ExpectedPid $BrowserPid
        $receipt.actionPromptScope = @{ complete = $actionInspection.complete;
            reason = $actionInspection.reason; controls = $actionInspection.controls;
            visitedControls = $actionInspection.visitedControls;
            attemptedNodes = $actionInspection.attemptedNodes;
            rootProcessId = $actionInspection.rootProcessId;
            nameTruncated = $actionInspection.nameTruncated }
        $allow = Get-PromptAction -Inspection $actionInspection
        $final = Get-FinalInvokeIdentity -OriginalProcess $before `
            -OriginalForeground $foreground -Allow $allow
        $receipt.finalIdentityRecheck = @{ before = $final.diagnostic }
        if (-not (Test-FinalInvokeIdentity -State $final -ExpectedPid $BrowserPid)) {
            if (Test-FinalEdgeRefocusCandidate -State $final `
                -CandidateBrowserName $BrowserName -ExpectedPid $BrowserPid `
                -AlreadyAttempted $refocusAttempted) {
                $refocusArgs = @{
                    Phase = 'final'; OriginalForeground = $foreground;
                    CurrentForeground = $final.foreground; OriginalProcess = $before;
                    CurrentProcess = $final.process; PromptInspection = $actionInspection;
                    PromptScope = $receipt.actionPromptScope;
                    PromptWindowCount = $promptWindows.Count;
                    WindowEnumeration = $final.enumeration; OwnedWindows = $final.windows;
                    Receipt = $receipt; AlreadyAttempted = $refocusAttempted
                }
                $refocus = Invoke-OneTimeEdgePromptRefocus @refocusArgs
                if ($refocus.restored) {
                    $refocusAttempted = $true
                    $actionInspection = Get-PromptInspection -Prompt $promptWindows[0] `
                        -ExpectedPid $BrowserPid
                    $receipt.actionPromptScopeAfterRefocus = @{
                        complete = $actionInspection.complete;
                        reason = $actionInspection.reason;
                        controls = $actionInspection.controls;
                        visitedControls = $actionInspection.visitedControls;
                        attemptedNodes = $actionInspection.attemptedNodes;
                        rootProcessId = $actionInspection.rootProcessId;
                        nameTruncated = $actionInspection.nameTruncated
                    }
                    $allow = Get-PromptAction -Inspection $actionInspection
                    $final = Get-FinalInvokeIdentity -OriginalProcess $before `
                        -OriginalForeground $foreground -Allow $allow
                    $receipt.finalIdentityRecheck.afterRefocus = $final.diagnostic
                }
            } elseif ($BrowserName -ceq 'msedge' -and $refocusAttempted) {
                $receipt.edgeRefocusRepeat = @{ phase = 'final'; status = 'already-attempted' }
            }
        }
        if (-not (Test-FinalInvokeIdentity -State $final -ExpectedPid $BrowserPid)) {
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
        'action-identity-changed-before-invoke','allow-invoke-pattern-unavailable',
        'edge-refocus-failed','edge-refocus-identity-changed')) {
        $reason = 'native-capture-unavailable'
    }
    $receipt.status = $(if ($receipt.permissionGrantAttempted) { 'unverified-after-invoke' }
        else { 'skipped' })
    $receipt.reason = $reason
} finally {
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 6))
}
