import { describe, expect, it } from "vitest";

import { parseCodeToInstructions } from "./parser";

describe("legacy parser", () => {
  it("recognises declarations, bare reassignment and console.log, noops the rest", () => {
    const result = parseCodeToInstructions(
      "// skip me\nlet x = 1\nx = x + 1\nconsole.log(x)\nif (true) { console.log(2) }",
    );

    expect(result.map((instruction) => instruction.type)).toEqual([
      "assign",
      "assign",
      "log",
      "noop",
    ]);
    expect(result[0]).toMatchObject({
      lineNumber: 2,
      variable: "x",
      expression: "1",
    });
    expect(result[3]?.expression).toBe("if (true) { console.log(2) }");
  });

  it("returns an empty list for blank or comment-only source", () => {
    expect(parseCodeToInstructions("\n  \n// nothing\n")).toEqual([]);
  });
});
