# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
# One bounded UIA action for the observed Edge developer-mode warning.
param(
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$BrowserPid,
    [Parameter(Mandatory=$true)][string]$Profile,
    [Parameter(Mandatory=$true)][string]$Output,
    [Parameter(Mandatory=$true)][ValidateSet('after-permission','warning-first')][string]$Mode,
    [string]$OriginalPermissionHandle,
    [Parameter(Mandatory=$true)][string]$ExpectedCreationUtcTicks,
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$ExpectedSessionId,
    [switch]$InvokeLater,
    [Parameter(Mandatory=$true)][string]$ExpectedWarningHandle
)
$ErrorActionPreference = 'Stop'
$receiptPath = Join-Path $Output $(if ($InvokeLater) {
    'userscript-manager-edge-warning-action.json'
} else { 'userscript-manager-edge-warning.json' })
$receipt = @{ status = 'skipped'; reason = 'ownership-unverified'; capture = 'uia-only';
    screenshot = 'not-captured'; laterAttempted = $false; mode = $Mode;
    originalPermissionHandle = $(if ($Mode -ceq 'after-permission') {
        $OriginalPermissionHandle
    } else { $null }) }

# Windows PowerShell 5.1 -File reads ASCII labels reliably without a BOM.
$script:WarningTitle = [string]::Concat([char[]]@(0xAC1C,0xBC1C,0xC790,0x0020,0xBAA8,0xB4DC,0xC5D0,0xC11C,0x0020,0xD655,0xC7A5,0x0020,0xC0AC,0xC6A9,0x0020,0xD574,0xC81C))
$script:CloseLabel = [string]::Concat([char[]]@(0xB2EB,0xAE30))
$script:DisableLabel = [string]::Concat([char[]]@(0xD655,0xC7A5,0x0020,0xC0AC,0xC6A9,0x0020,0xD574,0xC81C))
$script:LaterLabel = [string]::Concat([char[]]@(0xB098,0xC911,0xC5D0))
$script:BodyLabel = [string]::Concat([char[]]@(0xAC1C,0xBC1C,0xC790,0x0020,0xBAA8,0xB4DC,0xC5D0,0xC11C,0x0020,0xD655,0xC7A5,0xC744,0x0020,0xC2E4,0xD589,0xD558,0xBA74,0x0020,0xC7A5,0xCE58,0xB97C,0x0020,0xC190,0xC0C1,0xC2DC,0xD0AC,0x0020,0xC218,0x0020,0xC788,0xC2B5,0xB2C8,0xB2E4,0x002E,0x0020,0xAC1C,0xBC1C,0xC790,0xAC00,0x0020,0xC544,0xB2CC,0x0020,0xACBD,0xC6B0,0x0020,0xAC1C,0xBC1C,0xC790,0x0020,0xBAA8,0xB4DC,0xC5D0,0xC11C,0x0020,0xD655,0xC7A5,0x0020,0xC0AC,0xC6A9,0xC744,0x0020,0xD574,0xC81C,0xD558,0xC5EC,0x0020,0xC7A5,0xCE58,0xB97C,0x0020,0xBCF4,0xD638,0xD558,0xC138,0xC694,0x002E))
$script:LinkLabel = [string]::Concat([char[]]@(0xC790,0xC138,0xD788,0x0020,0xC54C,0xC544,0xBCF4,0xAE30))

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class XegEdgeWarningWindow {
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool IsChild(IntPtr parent, IntPtr child);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    public static uint WindowPid(IntPtr hwnd) {
        uint pid;
        return hwnd != IntPtr.Zero && GetWindowThreadProcessId(hwnd, out pid) != 0 ? pid : 0;
    }
    public static bool IsOwned(IntPtr hwnd, uint expectedPid) {
        uint pid;
        return hwnd != IntPtr.Zero && GetWindowThreadProcessId(hwnd, out pid) != 0 &&
            pid == expectedPid && IsWindowVisible(hwnd);
    }
}
'@

function Test-OwnedChildPane {
    param($Facts)
    if ($null -eq $Facts -or $Facts.depth -ne 1 -or $Facts.name -cne '' -or
        $Facts.controlType -cne 'ControlType.Pane' -or
        $Facts.hasChild -ne $false -or $Facts.processId -le 0 -or
        $Facts.processId -eq $Facts.browserPid -or
        $Facts.nativeWindowHandle -le 0 -or
        $Facts.windowPid -ne $Facts.processId -or
        $Facts.insideWarning -ne $true -or
        $Facts.parentPid -ne $Facts.browserPid -or
        $Facts.sessionId -ne $Facts.browserSessionId -or
        $Facts.executablePath -ine $Facts.browserExecutablePath -or
        $Facts.executablePath -match '^\\\\' -or
        $Facts.creationUtcTicks -cnotmatch '^\d{15,20}$' -or
        [int64]$Facts.creationUtcTicks -lt [int64]$Facts.browserCreationUtcTicks) {
        return $false
    }
    $escapedProfile = [regex]::Escape($Facts.profile)
    return [bool]($Facts.commandLine -match
        "(?i)(?:^|\s)`"?--user-data-dir=`"?$escapedProfile`"?(?=\s|$)")
}

function Get-OwnedBrowser {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $BrowserPid"
    if ($null -eq $process -or $null -eq $process.ExecutablePath -or
        $null -eq $process.CommandLine -or $null -eq $process.CreationDate) {
        throw 'browser-process-unavailable'
    }
    if ([IO.Path]::GetFileName($process.ExecutablePath) -ine 'msedge.exe' -or
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
    if ([Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0 -or
        [int]$process.SessionId -ne $ExpectedSessionId -or
        [Diagnostics.Process]::GetCurrentProcess().SessionId -ne $ExpectedSessionId) {
        throw 'browser-session-unverified'
    }
    if (([datetime]$process.CreationDate).ToUniversalTime().Ticks.ToString() -cne
        $ExpectedCreationUtcTicks) { throw 'browser-creation-changed' }
    return $process
}

function Get-CompleteTree {
    param([Windows.Automation.AutomationElement]$Root, [IntPtr]$WarningWindow,
        $BrowserProcess, [string]$ResolvedProfile)
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue(@($Root, 0))
    $seen = [Collections.Generic.HashSet[string]]::new()
    $controls = New-Object System.Collections.ArrayList
    $later = New-Object System.Collections.ArrayList
    $reason = $null
    $rejectedControl = $null
    $attempted = 0
    $ownedChildPanes = 0
    while ($queue.Count -gt 0 -and $null -eq $reason) {
        if ($attempted -ge 128) { $reason = 'node-cap'; break }
        $entry = $queue.Dequeue()
        $element = $entry[0]
        $depth = [int]$entry[1]
        $attempted++
        try {
            $id = $element.GetRuntimeId()
            if ($null -eq $id -or $id.Length -eq 0) { $reason = 'runtime-id-unavailable'; break }
            if (-not $seen.Add(($id -join ','))) { $reason = 'duplicate-runtime-id'; break }
            $current = $element.Current
            $currentPid = [int]$current.ProcessId
            if ($currentPid -ne $BrowserPid) {
                $rejectedControl = @{ processId = $currentPid; depth = $depth;
                    controlType = ''; name = ''; providerDescriptionSupported = $null;
                    processIdSupported = $null; nativeWindowHandleSupported = $null }
                try {
                    $value = $element.GetCurrentPropertyValue(
                        [Windows.Automation.AutomationElement]::ProcessIdProperty, $true)
                    $rejectedControl.processIdSupported = -not [object]::ReferenceEquals(
                        $value, [Windows.Automation.AutomationElement]::NotSupported)
                } catch {}
                try {
                    $type = [string]$current.ControlType.ProgrammaticName
                    $rejectedControl.controlType = $type.Substring(0, [Math]::Min(80, $type.Length))
                } catch {}
                try {
                    $name = [string]$current.Name
                    $knownNames = @($script:WarningTitle, $script:CloseLabel,
                        $script:DisableLabel, $script:LaterLabel, $script:BodyLabel,
                        $script:LinkLabel, '')
                    $rejectedControl.name = $(if ($name -cin $knownNames) {
                        $name
                    } else { '[redacted]' })
                    $rejectedControl.nameLength = $name.Length
                } catch {}
                try {
                    $value = $element.GetCurrentPropertyValue(
                        [Windows.Automation.AutomationElement]::NativeWindowHandleProperty, $true)
                    $supported = -not [object]::ReferenceEquals(
                        $value, [Windows.Automation.AutomationElement]::NotSupported)
                    $rejectedControl.nativeWindowHandleSupported = $supported
                    if ($supported) { $rejectedControl.nativeWindowHandle = [int]$value }
                } catch {}
                try {
                    $value = $element.GetCurrentPropertyValue(
                        [Windows.Automation.AutomationElement]::ProviderDescriptionProperty, $true)
                    $rejectedControl.providerDescriptionSupported = -not [object]::ReferenceEquals(
                        $value, [Windows.Automation.AutomationElement]::NotSupported)
                } catch {}
                $firstChild = $walker.GetFirstChild($element)
                $rejectedControl.hasChild = ($null -ne $firstChild)
                $nativeHandle = [int]$current.NativeWindowHandle
                $window = [IntPtr]::new([int64]$nativeHandle)
                $windowPid = [int][XegEdgeWarningWindow]::WindowPid($window)
                $insideWarning = [XegEdgeWarningWindow]::IsChild($WarningWindow, $window)
                $rejectedControl.windowPid = $windowPid
                $rejectedControl.insideWarning = $insideWarning
                $childProcess = $(if ($currentPid -gt 0) {
                    Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid"
                } else { $null })
                $facts = @{ depth = $depth; name = [string]$current.Name;
                    controlType = [string]$current.ControlType.ProgrammaticName;
                    hasChild = ($null -ne $firstChild); processId = $currentPid;
                    browserPid = $BrowserPid; nativeWindowHandle = $nativeHandle;
                    windowPid = $windowPid; insideWarning = $insideWarning;
                    parentPid = $(if ($childProcess) { [int]$childProcess.ParentProcessId } else { -1 });
                    sessionId = $(if ($childProcess) { [int]$childProcess.SessionId } else { -1 });
                    browserSessionId = $ExpectedSessionId;
                    executablePath = $(if ($childProcess) { [string]$childProcess.ExecutablePath } else { '' });
                    browserExecutablePath = [string]$BrowserProcess.ExecutablePath;
                    creationUtcTicks = $(if ($childProcess -and $childProcess.CreationDate) {
                        ([datetime]$childProcess.CreationDate).ToUniversalTime().Ticks.ToString()
                    } else { '' });
                    browserCreationUtcTicks = $ExpectedCreationUtcTicks;
                    commandLine = $(if ($childProcess) { [string]$childProcess.CommandLine } else { '' });
                    profile = $ResolvedProfile }
                if ($ownedChildPanes -ge 1 -or -not (Test-OwnedChildPane -Facts $facts)) {
                    $reason = 'cross-process'; break
                }
                $ownedChildPanes++
                [void]$controls.Add(@{ depth = $depth; name = ''; controlType = 'ControlType.Pane';
                    isEnabled = [bool]$current.IsEnabled;
                    isOffscreen = [bool]$current.IsOffscreen;
                    ownership = 'owned-child-pane'; processId = $currentPid;
                    nativeWindowHandle = $nativeHandle;
                    creationUtcTicks = $facts.creationUtcTicks })
                $rejectedControl = $null
                continue
            }
            $name = [string]$current.Name
            $type = [string]$current.ControlType.ProgrammaticName
            if ($name.Length -gt 180 -or $type.Length -gt 80) { $reason = 'name-cap'; break }
            [void]$controls.Add(@{ depth = $depth; name = $name; controlType = $type;
                isEnabled = [bool]$current.IsEnabled; isOffscreen = [bool]$current.IsOffscreen })
            if ($type -ceq 'ControlType.Button' -and $name -ceq $script:LaterLabel) {
                [void]$later.Add($element)
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
    return @{ complete = ($null -eq $reason -and $queue.Count -eq 0);
        reason = $reason; controls = @($controls.ToArray());
        visitedControls = $controls.Count; attemptedNodes = $attempted;
        rejectedControl = $rejectedControl;
        laterElements = @($later.ToArray()) }
}

function Test-ExactWarning {
    param($Inspection)
    if (-not $Inspection.complete -or $Inspection.reason -ne $null -or
        $Inspection.visitedControls -ne $Inspection.attemptedNodes -or
        $Inspection.controls.Count -gt 128 -or $Inspection.controls.Count -lt 8) { return $false }
    $counts = @{ titlePane = 0; titleText = 0; close = 0; disable = 0;
        later = 0; body = 0; link = 0 }
    foreach ($control in $Inspection.controls) {
        $name = $control.name
        $type = $control.controlType
        if ($name -ceq '' -and $type -ceq 'ControlType.Pane') { continue }
        if ($name -ceq $script:WarningTitle -and $type -ceq 'ControlType.Pane' -and
            $control.depth -eq 0) { $counts.titlePane++; continue }
        if ($name -ceq $script:WarningTitle -and $type -ceq 'ControlType.Text') {
            $counts.titleText++; continue
        }
        if ($name -ceq $script:CloseLabel -and $type -ceq 'ControlType.Button') {
            $counts.close++; continue
        }
        if ($name -ceq $script:DisableLabel -and $type -ceq 'ControlType.Button') {
            $counts.disable++; continue
        }
        if ($name -ceq $script:LaterLabel -and $type -ceq 'ControlType.Button') {
            $counts.later++
            if ($control.isEnabled -ne $true -or $control.isOffscreen -ne $false) {
                return $false
            }
            continue
        }
        if ($name -ceq $script:BodyLabel -and $type -ceq 'ControlType.Text') {
            $counts.body++; continue
        }
        if ($name -ceq $script:LinkLabel -and $type -ceq 'ControlType.Hyperlink') {
            $counts.link++; continue
        }
        return $false
    }
    return ($counts.titlePane -eq 1 -and $counts.titleText -eq 2 -and
        $counts.close -eq 1 -and $counts.disable -eq 1 -and
        $counts.later -eq 1 -and $counts.body -eq 1 -and $counts.link -eq 1)
}

function Test-SameWarningScope {
    param($Expected, $Actual)
    if ($null -eq $Expected -or $Expected.complete -ne $true -or
        $Expected.reason -ne $null -or
        $Expected.visitedControls -ne $Actual.visitedControls -or
        $Expected.attemptedNodes -ne $Actual.attemptedNodes -or
        $Expected.controls.Count -ne $Actual.controls.Count) { return $false }
    for ($index = 0; $index -lt $Actual.controls.Count; $index++) {
        $before = $Expected.controls[$index]
        $after = $Actual.controls[$index]
        if ($before.depth -ne $after.depth -or $before.name -cne $after.name -or
            $before.controlType -cne $after.controlType -or
            $before.isEnabled -ne $after.isEnabled -or
            $before.isOffscreen -ne $after.isOffscreen -or
            $before.ownership -cne $after.ownership -or
            $before.processId -ne $after.processId -or
            $before.nativeWindowHandle -ne $after.nativeWindowHandle -or
            $before.creationUtcTicks -cne $after.creationUtcTicks) { return $false }
    }
    return $true
}

try {
    if ($Mode -cnotin @('after-permission','warning-first') -or
        $ExpectedCreationUtcTicks -cnotmatch '^\d{15,20}$' -or
        $ExpectedWarningHandle -cnotmatch '^[1-9]\d{0,19}$' -or
        ($Mode -ceq 'after-permission' -and
            $OriginalPermissionHandle -cnotmatch '^[1-9]\d{0,19}$') -or
        ($Mode -ceq 'warning-first' -and $OriginalPermissionHandle)) {
        throw 'expected-identity-invalid'
    }
    $before = Get-OwnedBrowser
    $oldHandle = $null
    if ($Mode -ceq 'after-permission') {
        $oldHandle = [IntPtr]::new([int64]::Parse($OriginalPermissionHandle))
    }
    $warning = [XegEdgeWarningWindow]::GetForegroundWindow()
    if (-not [XegEdgeWarningWindow]::IsOwned($warning, [uint32]$BrowserPid) -or
        ($Mode -ceq 'after-permission' -and
            (-not [XegEdgeWarningWindow]::IsOwned($oldHandle, [uint32]$BrowserPid) -or
                $oldHandle -eq $warning))) { throw 'window-identity-changed' }
    $warningHandle = $warning.ToInt64().ToString()
    if ($ExpectedWarningHandle -cne $warningHandle) {
        throw 'warning-handle-changed'
    }
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $warningRoot = [Windows.Automation.AutomationElement]::FromHandle($warning)
    if ($null -eq $warningRoot -or
        $warningRoot.Current.ProcessId -ne $BrowserPid) { throw 'uia-root-unverified' }
    $resolvedProfile = (Resolve-Path -LiteralPath $Profile).ProviderPath.TrimEnd('\')
    $inspection = Get-CompleteTree -Root $warningRoot -WarningWindow $warning `
        -BrowserProcess $before -ResolvedProfile $resolvedProfile
    $receipt.warningScope = @{ complete = $inspection.complete; reason = $inspection.reason;
        controls = $inspection.controls; visitedControls = $inspection.visitedControls;
        attemptedNodes = $inspection.attemptedNodes;
        rejectedControl = $inspection.rejectedControl }
    if ($inspection.rejectedControl -and $inspection.rejectedControl.processId -gt 0) {
        try {
            $rejectedPid = [int]$inspection.rejectedControl.processId
            $rejectedProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $rejectedPid"
            if ($null -ne $rejectedProcess) {
                $resolvedProfile = (Resolve-Path -LiteralPath $Profile).ProviderPath.TrimEnd('\')
                $escapedProfile = [regex]::Escape($resolvedProfile)
                $executableLeaf = [IO.Path]::GetFileName([string]$rejectedProcess.ExecutablePath)
                $receipt.warningScope.rejectedProcess = @{
                    executableLeaf = $executableLeaf.Substring(0, [Math]::Min(120, $executableLeaf.Length))
                    parentPid = [int]$rejectedProcess.ParentProcessId
                    sessionId = [int]$rejectedProcess.SessionId
                    creationUtcTicks = ([datetime]$rejectedProcess.CreationDate).ToUniversalTime().Ticks.ToString()
                    sameExecutable = ($rejectedProcess.ExecutablePath -ieq $before.ExecutablePath)
                    taskProfile = ([string]$rejectedProcess.CommandLine -match
                        "(?i)(?:^|\s)`"?--user-data-dir=`"?$escapedProfile`"?(?=\s|$)")
                }
            }
        } catch {}
    }
    $receipt.browserPid = $BrowserPid
    $receipt.creationUtcTicks = $ExpectedCreationUtcTicks
    $receipt.browserSessionId = $ExpectedSessionId
    $receipt.warningHandle = $warningHandle
    if (-not (Test-ExactWarning -Inspection $inspection) -or
        $inspection.laterElements.Count -ne 1) { throw 'warning-not-exact' }
    if ($InvokeLater) {
        $capturePath = Join-Path $Output 'userscript-manager-edge-warning.json'
        $capture = Get-Content -LiteralPath $capturePath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($capture.status -cne 'captured' -or
            $capture.browserPid -ne $BrowserPid -or
            $capture.creationUtcTicks -cne $ExpectedCreationUtcTicks -or
            $capture.browserSessionId -ne $ExpectedSessionId -or
            $capture.mode -cne $Mode -or
            $capture.originalPermissionHandle -cne $receipt.originalPermissionHandle -or
            $capture.warningHandle -cne $warningHandle -or
            -not (Test-SameWarningScope -Expected $capture.warningScope -Actual $inspection)) {
            throw 'warning-signature-changed'
        }
    }
    $after = Get-OwnedBrowser
    if ($after.CreationDate -ne $before.CreationDate -or
        [XegEdgeWarningWindow]::GetForegroundWindow() -ne $warning -or
        ($Mode -ceq 'after-permission' -and
            -not [XegEdgeWarningWindow]::IsOwned($oldHandle, [uint32]$BrowserPid)) -or
        -not [XegEdgeWarningWindow]::IsOwned($warning, [uint32]$BrowserPid)) {
        throw 'window-identity-changed'
    }
    $receipt.status = 'captured'
    $receipt.reason = $null
    if ($InvokeLater) {
        $later = $inspection.laterElements[0]
        $laterCurrent = $later.Current
        $finalProcess = Get-OwnedBrowser
        if ($laterCurrent.ProcessId -ne $BrowserPid -or -not $laterCurrent.IsEnabled -or
            $laterCurrent.IsOffscreen -or $finalProcess.CreationDate -ne $before.CreationDate -or
            [XegEdgeWarningWindow]::GetForegroundWindow() -ne $warning -or
            ($Mode -ceq 'after-permission' -and
                -not [XegEdgeWarningWindow]::IsOwned($oldHandle, [uint32]$BrowserPid)) -or
            -not [XegEdgeWarningWindow]::IsOwned($warning, [uint32]$BrowserPid)) {
            throw 'action-identity-changed-before-invoke'
        }
        $pattern = $later.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
        if ($null -eq $pattern) { throw 'later-invoke-pattern-unavailable' }
        $receipt.laterAttempted = $true
        $pattern.Invoke()
        $receipt.status = 'invoked'
    }
} catch {
    $reason = [string]$_.Exception.Message
    if ($reason -cnotin @('expected-identity-invalid','browser-process-unavailable',
        'browser-executable-unverified','browser-profile-unverified',
        'browser-session-unverified','browser-creation-changed','window-identity-changed',
        'warning-handle-changed','warning-signature-changed',
        'uia-root-unverified',
        'warning-not-exact','action-identity-changed-before-invoke',
        'later-invoke-pattern-unavailable')) { $reason = 'native-warning-unavailable' }
    $receipt.status = $(if ($receipt.laterAttempted) { 'unverified-after-invoke' }
        else { 'skipped' })
    $receipt.reason = $reason
} finally {
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 7))
}
