# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP
param(
    [Parameter(Mandatory)][string]$TitleMarker,
    [Parameter(Mandatory)][ValidateSet('chrome.exe', 'msedge.exe', 'firefox.exe')][string]$BrowserImage
)

$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

public static class XegScrollbarInput {
    public sealed class Window {
        public IntPtr Handle;
        public int ProcessId;
        public string Title;
        public string ImagePath;
    }
    private delegate bool EnumWindowsProc(IntPtr handle, IntPtr state);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr state);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr handle, StringBuilder text, int length);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr handle);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr handle);
    [DllImport("user32.dll")] private static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] private static extern int GetSystemMetrics(int index);
    [DllImport("user32.dll")] private static extern bool GetCursorPos(out POINT point);
    [DllImport("user32.dll")] private static extern bool SetProcessDpiAwarenessContext(IntPtr context);
    [DllImport("user32.dll")] private static extern IntPtr GetThreadDpiAwarenessContext();
    [DllImport("user32.dll")] private static extern int GetAwarenessFromDpiAwarenessContext(IntPtr context);
    [DllImport("user32.dll", SetLastError = true)] private static extern uint SendInput(uint count, INPUT[] input, int size);
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
    [StructLayout(LayoutKind.Sequential)] private struct MOUSEINPUT {
        public int dx, dy;
        public uint mouseData, flags, time;
        public UIntPtr extraInfo;
    }
    [StructLayout(LayoutKind.Sequential)] private struct INPUT {
        public uint type;
        public MOUSEINPUT mouse;
    }
    public static bool BecomeDpiAware() { return SetProcessDpiAwarenessContext(new IntPtr(-4)); }
    public static int DpiAwareness() { return GetAwarenessFromDpiAwarenessContext(GetThreadDpiAwarenessContext()); }
    public static IntPtr Foreground() { return GetForegroundWindow(); }
    public static bool Focus(IntPtr handle) { return SetForegroundWindow(handle); }
    public static POINT Cursor() { POINT point; if (!GetCursorPos(out point)) throw new InvalidOperationException("GetCursorPos failed"); return point; }
    public static void Move(int x, int y) { if (!SetCursorPos(x, y)) throw new InvalidOperationException("SetCursorPos failed"); }
    public static int Metric(int index) { return GetSystemMetrics(index); }
    public static void Button(bool down) {
        var input = new INPUT[] { new INPUT { type = 0, mouse = new MOUSEINPUT { flags = down ? 0x0002u : 0x0004u } } };
        if (SendInput(1, input, Marshal.SizeOf(typeof(INPUT))) != 1) throw new InvalidOperationException("SendInput failed");
    }
    public static List<Window> Find(string marker, string image) {
        var found = new List<Window>();
        EnumWindows((handle, state) => {
            if (!IsWindowVisible(handle)) return true;
            var text = new StringBuilder(512);
            GetWindowText(handle, text, text.Capacity);
            var title = text.ToString();
            if (!title.Contains(marker)) return true;
            uint processId;
            GetWindowThreadProcessId(handle, out processId);
            try {
                var path = Process.GetProcessById((int)processId).MainModule.FileName;
                if (String.Equals(Path.GetFileName(path), image, StringComparison.OrdinalIgnoreCase)) {
                    found.Add(new Window { Handle = handle, ProcessId = (int)processId, Title = title, ImagePath = path });
                }
            } catch { /* An inaccessible matching process cannot be selected. */ }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
'@
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
if (-not [XegScrollbarInput]::BecomeDpiAware() -and [XegScrollbarInput]::DpiAwareness() -lt 1) {
    throw 'Could not establish DPI awareness'
}

$window = $null
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $matches = @([XegScrollbarInput]::Find($TitleMarker, $BrowserImage))
    if ($matches.Count -eq 1) { $window = $matches[0]; break }
    if ($matches.Count -gt 1) { throw 'Owned browser title is not unique' }
    Start-Sleep -Milliseconds 100
}
if ($null -eq $window) { throw 'Owned browser window was not found' }

$previousForeground = [XegScrollbarInput]::Foreground()
$previousCursor = [XegScrollbarInput]::Cursor()
$buttonDown = $false
try {
    if ([XegScrollbarInput]::Foreground() -ne $window.Handle) {
        [void][XegScrollbarInput]::Focus($window.Handle)
        Start-Sleep -Milliseconds 100
    }
    if ([XegScrollbarInput]::Foreground() -ne $window.Handle) { throw 'Owned browser is not foreground' }
    $condition = [System.Windows.Automation.PropertyCondition]::new(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Document
    )
    $visible = @()
    $root = $null
    $uiaAttempts = 0
    for ($uiaAttempts = 1; $uiaAttempts -le 15; $uiaAttempts++) {
        $root = [System.Windows.Automation.AutomationElement]::FromHandle($window.Handle)
        $visible = @()
        if ($null -ne $root) {
            $documents = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
            foreach ($document in $documents) {
                $rect = $document.Current.BoundingRectangle
                if (-not $document.Current.IsOffscreen -and $rect.Width -gt 100 -and $rect.Height -gt 100) {
                    $visible += $rect
                }
            }
        }
        if ($visible.Count -eq 1) { break }
        if ($visible.Count -gt 1) { throw "Owned browser has $($visible.Count) visible UIA documents" }
        if ($uiaAttempts -lt 15) { Start-Sleep -Milliseconds 200 }
    }
    if ($visible.Count -ne 1) {
        $samples = @()
        if ($null -ne $root) {
            $walker = [System.Windows.Automation.TreeWalker]::RawViewWalker
            $queue = New-Object 'System.Collections.Generic.Queue[object]'
            $queue.Enqueue(@{ element = $root; depth = 0 })
            while ($queue.Count -gt 0 -and $samples.Count -lt 32) {
                $entry = $queue.Dequeue()
                try {
                    $current = $entry.element.Current
                    $rect = $current.BoundingRectangle
                    $samples += @{ type = $current.ControlType.ProgrammaticName; depth = $entry.depth;
                        offscreen = $current.IsOffscreen;
                        rect = @{ left = $rect.Left; top = $rect.Top; width = $rect.Width; height = $rect.Height } }
                    $child = $walker.GetFirstChild($entry.element)
                    while ($null -ne $child -and ($queue.Count + $samples.Count) -lt 32) {
                        $queue.Enqueue(@{ element = $child; depth = $entry.depth + 1 })
                        $child = $walker.GetNextSibling($child)
                    }
                } catch {
                    if ($samples.Count -lt 32) {
                        $samples += @{ type = 'unavailable'; depth = $entry.depth }
                    }
                }
            }
        }
        $sampleJson = $samples | ConvertTo-Json -Compress -Depth 5
        throw "Expected one visible owned-browser UIA document after $uiaAttempts attempts; found $($visible.Count); controls=$sampleJson"
    }
    $bounds = $visible[0]
    $desktop = @{ left = [XegScrollbarInput]::Metric(76); top = [XegScrollbarInput]::Metric(77);
        width = [XegScrollbarInput]::Metric(78); height = [XegScrollbarInput]::Metric(79) }
    if ($desktop.width -le 0 -or $desktop.height -le 0) { throw 'Physical desktop dimensions are invalid' }
    $response = @{ status = 'ready'; processId = $window.ProcessId; imagePath = $window.ImagePath;
        windowTitle = $window.Title; hwnd = $window.Handle.ToInt64();
        desktop = $desktop; uiaAttempts = $uiaAttempts;
        document = @{ left = $bounds.Left; top = $bounds.Top; width = $bounds.Width; height = $bounds.Height } }
    [Console]::Out.WriteLine(($response | ConvertTo-Json -Compress -Depth 5))
    [Console]::Out.Flush()
    while ($null -ne ($line = [Console]::In.ReadLine())) {
        $request = $line | ConvertFrom-Json
        if ([XegScrollbarInput]::Foreground() -ne $window.Handle) { throw 'Owned browser lost foreground during input' }
        switch ([string]$request.command) {
            'move' { [XegScrollbarInput]::Move([int]$request.x, [int]$request.y) }
            'down' { [XegScrollbarInput]::Move([int]$request.x, [int]$request.y); [XegScrollbarInput]::Button($true); $buttonDown = $true }
            'up' { if ($buttonDown) { [XegScrollbarInput]::Button($false); $buttonDown = $false } }
            'close' { [Console]::Out.WriteLine('{"status":"closed"}'); [Console]::Out.Flush(); break }
            default { throw 'Unknown native pointer command' }
        }
        [Console]::Out.WriteLine('{"status":"ok"}')
        [Console]::Out.Flush()
        if ($request.command -eq 'close') { break }
    }
} finally {
    try {
        if ($buttonDown) { [XegScrollbarInput]::Button($false) }
    } finally {
        try {
            [XegScrollbarInput]::Move($previousCursor.X, $previousCursor.Y)
        } finally {
            if ($previousForeground -ne [IntPtr]::Zero -and $previousForeground -ne $window.Handle) {
                [void][XegScrollbarInput]::Focus($previousForeground)
            }
        }
    }
}
