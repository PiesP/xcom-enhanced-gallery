import { NavigationStateMachine } from "@shared/state/machines/navigation.machine";
import { describe, expect, it } from "vitest";

describe("NavigationStateMachine", () => {
  it("should create initial state", () => {
    const state = NavigationStateMachine.createInitialState();
    expect(state.lastNavigatedIndex).toBeNull();
    expect(state.lastSource).toBe("auto-focus");
    expect(state.lastTimestamp).toBeGreaterThan(0);
  });

  describe("NAVIGATE", () => {
    it("should track navigation metadata", () => {
      const initialState = NavigationStateMachine.createInitialState();
      const result = NavigationStateMachine.transition(initialState, {
        type: "NAVIGATE",
        payload: {
          targetIndex: 5,
          source: "button",
          trigger: "click",
        },
      });

      expect(result.newState.lastNavigatedIndex).toBe(5);
      expect(result.newState.lastSource).toBe("button");
      expect(result.isDuplicate).toBe(false);
    });

    it("should detect duplicate manual navigation", () => {
      const initialState = NavigationStateMachine.createInitialState();
      // First navigation
      const result1 = NavigationStateMachine.transition(initialState, {
        type: "NAVIGATE",
        payload: {
          targetIndex: 5,
          source: "button",
          trigger: "click",
        },
      });

      // Duplicate navigation
      const result2 = NavigationStateMachine.transition(result1.newState, {
        type: "NAVIGATE",
        payload: {
          targetIndex: 5,
          source: "button",
          trigger: "click",
        },
      });

      expect(result2.newState.lastNavigatedIndex).toBe(5);
      expect(result2.isDuplicate).toBe(true);
    });
  });

  describe("SET_FOCUS", () => {
    it("should update metadata only", () => {
      const initialState = NavigationStateMachine.createInitialState();
      const result = NavigationStateMachine.transition(initialState, {
        type: "SET_FOCUS",
        payload: {
          focusIndex: 3,
          source: "keyboard",
        },
      });

      // Focus changes don't update lastNavigatedIndex
      expect(result.newState.lastNavigatedIndex).toBeNull();
      expect(result.newState.lastSource).toBe("keyboard");
    });

    it("should handle null focus index", () => {
      const initialState = NavigationStateMachine.createInitialState();
      const result = NavigationStateMachine.transition(initialState, {
        type: "SET_FOCUS",
        payload: {
          focusIndex: null,
          source: "auto-focus",
        },
      });

      expect(result.newState.lastSource).toBe("auto-focus");
    });
  });

  describe("RESET", () => {
    it("should reset state", () => {
      const initialState = NavigationStateMachine.createInitialState();
      const modifiedState = NavigationStateMachine.transition(initialState, {
        type: "NAVIGATE",
        payload: {
          targetIndex: 5,
          source: "button",
          trigger: "click",
        },
      }).newState;

      const result = NavigationStateMachine.transition(modifiedState, {
        type: "RESET",
      });

      expect(result.newState.lastNavigatedIndex).toBeNull();
      expect(result.newState.lastSource).toBe("auto-focus");
    });
  });
});
