/**
 * @name Forbidden touch and pointer events
 * @description Detects usage of touch events and pointer events that violate the PC-only input policy.
 * @kind problem
 * @problem.severity error
 * @id javascript/xeg/forbidden-touch-events
 * @tags maintainability
 *       design-policy
 *       accessibility
 */

import javascript

/**
 * Holds if the event name is a forbidden touch or pointer event.
 */
predicate isForbiddenEvent(string eventName) {
  // Touch events
  eventName = "touchstart" or
  eventName = "touchmove" or
  eventName = "touchend" or
  eventName = "touchcancel" or
  // Pointer events
  eventName = "pointerdown" or
  eventName = "pointerup" or
  eventName = "pointermove" or
  eventName = "pointerenter" or
  eventName = "pointerleave" or
  eventName = "pointercancel" or
  eventName = "pointerover" or
  eventName = "pointerout" or
  // Gesture events
  eventName = "gesturestart" or
  eventName = "gesturechange" or
  eventName = "gestureend"
}

/**
 * Holds if the file is a test file where touch events might be used for verification.
 */
predicate isTestFile(File file) {
  file.getRelativePath().matches("%test/%") or
  file.getRelativePath().matches("%playwright/%") or
  file.getBaseName().matches("%.test.%") or
  file.getBaseName().matches("%.spec.%")
}

from CallExpr call, string eventName
where
  // addEventListener calls
  call.getCalleeName() = "addEventListener" and
  exists(StringLiteral arg |
    arg = call.getArgument(0) and
    eventName = arg.getValue() and
    isForbiddenEvent(eventName)
  ) and
  not isTestFile(call.getFile())
select call,
  "Usage of '" + eventName +
    "' event is forbidden. This project follows a PC-only input policy. Use mouse/keyboard events instead (click, keydown, wheel, etc.)."
