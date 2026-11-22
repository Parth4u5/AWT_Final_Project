import type { SimulateResult, Step } from "@jsflow/engine";

import { parseCodeToInstructions } from "./parser";

const safeEvaluate = (
  expression: string,
  variables: Record<string, unknown>,
): unknown => {
  try {
    const evaluator = new Function(
      ...Object.keys(variables),
      `return (${expression});`,
    );
    return evaluator(...Object.values(variables));
  } catch {
    return expression;
  }
};

export const simulateCodeFlow = (sourceCode: string): SimulateResult => {
  const instructions = parseCodeToInstructions(sourceCode);
  const variables: Record<string, unknown> = {};
  const steps: Step[] = [];
  const logs: string[] = [];

  instructions.forEach((instruction) => {
    if (instruction.type === "assign") {
      const value = safeEvaluate(instruction.expression, variables);
      variables[instruction.variable] = value;
      steps.push({
        line: instruction.lineNumber,
        action: `Set ${instruction.variable}`,
        variables: { ...variables },
      });
      logs.push(
        `Line ${instruction.lineNumber}: ${instruction.variable} = ${String(value)}`,
      );
      return;
    }

    if (instruction.type === "log") {
      const value = safeEvaluate(instruction.expression, variables);
      steps.push({
        line: instruction.lineNumber,
        action: "Console output",
        variables: { ...variables },
      });
      logs.push(
        `Line ${instruction.lineNumber}: console.log -> ${String(value)}`,
      );
      return;
    }

    steps.push({
      line: instruction.lineNumber,
      action: `Execute: ${instruction.expression}`,
      variables: { ...variables },
    });
    logs.push(`Line ${instruction.lineNumber}: ${instruction.expression}`);
  });

  return { steps, logs };
};
