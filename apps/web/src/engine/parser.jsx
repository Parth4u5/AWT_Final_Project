const normalizeLine = (line) => line.trim();

export const parseCodeToInstructions = (sourceCode) => {
  const lines = sourceCode
    .split("\n")
    .map((raw, index) => ({
      lineNumber: index + 1,
      raw,
      normalized: normalizeLine(raw),
    }))
    .filter((line) => line.normalized && !line.normalized.startsWith("//"));

  return lines.map((line) => {
    const { normalized } = line;

    if (normalized.startsWith("console.log")) {
      return {
        ...line,
        type: "log",
        expression: normalized
          .replace("console.log(", "")
          .replace(/\);?$/, "")
          .trim(),
      };
    }

    const declarationMatch = normalized.match(
      /^(let|const|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(.+);?$/,
    );
    if (declarationMatch) {
      return {
        ...line,
        type: "assign",
        variable: declarationMatch[2],
        expression: declarationMatch[3],
      };
    }

    const assignmentMatch = normalized.match(
      /^([a-zA-Z_$][\w$]*)\s*=\s*(.+);?$/,
    );
    if (assignmentMatch) {
      return {
        ...line,
        type: "assign",
        variable: assignmentMatch[1],
        expression: assignmentMatch[2],
      };
    }

    return {
      ...line,
      type: "noop",
      expression: normalized,
    };
  });
};
