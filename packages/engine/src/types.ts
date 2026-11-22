/** Types for the legacy regex engine and the forward-looking event model. */

export interface InstructionBase {
  lineNumber: number;
  raw: string;
  normalized: string;
  expression: string;
}

export interface LogInstruction extends InstructionBase {
  type: "log";
}

export interface AssignInstruction extends InstructionBase {
  type: "assign";
  variable: string;
}

export interface NoopInstruction extends InstructionBase {
  type: "noop";
}

export type Instruction = LogInstruction | AssignInstruction | NoopInstruction;

export interface Step {
  line: number;
  action: string;
  variables: Record<string, unknown>;
}

export interface SimulateResult {
  steps: Step[];
  logs: string[];
}

export type EngineEvent =
  | { kind: "assign"; line: number; variable: string; value: unknown }
  | { kind: "log"; line: number; value: unknown }
  | { kind: "call"; line: number; name: string }
  | { kind: "return"; line: number; value: unknown }
  | { kind: "branch"; line: number; taken: boolean }
  | { kind: "error"; line: number; name: string; message: string };

export interface ScopeSnapshot {
  name: string;
  variables: Record<string, unknown>;
  parent?: ScopeSnapshot;
}

export interface CallFrame {
  name: string;
  line: number;
  scope: ScopeSnapshot;
}

export interface EngineError {
  name: string;
  message: string;
  line?: number;
  column?: number;
}
