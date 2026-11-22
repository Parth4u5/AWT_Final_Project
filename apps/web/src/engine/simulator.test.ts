import { describe, expect, it } from "vitest";

import { simulateCodeFlow } from "./simulator";

describe("legacy simulator", () => {
  it("snapshots variables per step and prefixes every log with its line", () => {
    expect(simulateCodeFlow("let x = 1\nx = 2\nconsole.log(x)")).toEqual({
      steps: [
        { line: 1, action: "Set x", variables: { x: 1 } },
        { line: 2, action: "Set x", variables: { x: 2 } },
        { line: 3, action: "Console output", variables: { x: 2 } },
      ],
      logs: ["Line 1: x = 1", "Line 2: x = 2", "Line 3: console.log -> 2"],
    });
  });

  it("returns the raw expression string when evaluation fails", () => {
    const result = simulateCodeFlow("let x = nope");
    expect(result.steps[0]?.variables).toEqual({ x: "nope" });
  });

  it("records control flow as a noop step rather than executing it", () => {
    const result = simulateCodeFlow("for (let i = 0; i < 2; i++) {}");
    expect(result.steps[0]?.action).toBe(
      "Execute: for (let i = 0; i < 2; i++) {}",
    );
    expect(result.logs).toEqual(["Line 1: for (let i = 0; i < 2; i++) {}"]);
  });
});
