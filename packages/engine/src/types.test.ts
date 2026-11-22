import { expectTypeOf } from "expect-type";
import { describe, it } from "vitest";

import type { AssignInstruction, EngineEvent, SimulateResult } from "./types";

describe("engine domain types", () => {
  it("narrows an assign instruction on its literal type", () => {
    const instruction: AssignInstruction = {
      lineNumber: 1,
      raw: "let x = 1",
      normalized: "let x = 1",
      type: "assign",
      variable: "x",
      expression: "1",
    };

    expectTypeOf(instruction.type).toEqualTypeOf<"assign">();
    expectTypeOf(instruction.variable).toEqualTypeOf<string>();
  });

  it("discriminates events and locks the simulate result shape", () => {
    const event: EngineEvent = {
      kind: "assign",
      line: 1,
      variable: "x",
      value: 1,
    };
    const result: SimulateResult = { steps: [], logs: [] };

    expectTypeOf(event).toMatchTypeOf<EngineEvent>();
    expectTypeOf(result).toEqualTypeOf<SimulateResult>();
  });
});
