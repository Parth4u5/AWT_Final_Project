/**
 * Pure seed plan — no database, no DOM, no I/O.
 *
 * `seedDocuments` is an async generator: documents are produced one at a time
 * and consumed one at a time by `applySeed`, so seeding a large corpus never
 * holds the whole dataset in memory. Natural keys (email / title / slug) plus
 * `$setOnInsert` make a second run a no-op — this is the write-side "cache":
 * already-seeded documents are never fetched into memory or rewritten.
 */

import { randomBytes, scryptSync } from "node:crypto";

export type SeedCollection = "users" | "examples" | "challenges";

export interface SeedDocument {
  collection: SeedCollection;
  filter: Record<string, unknown>;
  document: Record<string, unknown>;
  label: string;
}

export interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

export interface SeedStats {
  inserted: number;
  unchanged: number;
}

export type Upsert = (
  collection: SeedCollection,
  filter: Record<string, unknown>,
  document: Record<string, unknown>,
) => Promise<boolean>;

type Example = readonly [
  title: string,
  description: string,
  category: string,
  difficulty: string,
  code: string,
];

// Deterministic, bounded content. Phase 4 task 4.17 / Phase 5 task 5.12
// replace placeholders with the reviewed 30-program corpus.
const EXAMPLES: readonly Example[] = [
  [
    "Hello Console",
    "Print your first message.",
    "basics",
    "beginner",
    'console.log("Hello, JS Flow!");',
  ],
  [
    "Declaring Variables",
    "let, const and reassignment.",
    "variables",
    "beginner",
    'let count = 0;\nconst label = "items";\ncount = count + 1;\nconsole.log(count, label);',
  ],
  [
    "Arithmetic Operators",
    "Add, subtract, multiply and divide.",
    "math",
    "beginner",
    "const a = 7, b = 3;\nconsole.log(a + b, a - b, a * b, a / b, a % b);",
  ],
  [
    "Comparison Operators",
    "Compare values and see booleans.",
    "math",
    "beginner",
    'console.log(5 > 3, 5 === 5, 5 !== "5");',
  ],
  [
    "If and Else",
    "Branch on a condition.",
    "conditionals",
    "beginner",
    'const score = 72;\nif (score >= 50) {\n  console.log("pass");\n} else {\n  console.log("retry");\n}',
  ],
  [
    "For Loop",
    "Count with a classic for loop.",
    "loops",
    "beginner",
    "for (let i = 0; i < 3; i = i + 1) {\n  console.log(i);\n}",
  ],
  [
    "While Loop",
    "Repeat until a condition changes.",
    "loops",
    "beginner",
    "let n = 0;\nwhile (n < 3) {\n  console.log(n);\n  n = n + 1;\n}",
  ],
  [
    "Do While",
    "Run the body at least once.",
    "loops",
    "intermediate",
    "let n = 5;\ndo {\n  console.log(n);\n  n = n - 1;\n} while (n > 0);",
  ],
  [
    "Nested Loops",
    "A loop inside a loop.",
    "loops",
    "intermediate",
    "for (let row = 1; row <= 2; row = row + 1) {\n  for (let col = 1; col <= 2; col = col + 1) {\n    console.log(row, col);\n  }\n}",
  ],
  [
    "Break and Continue",
    "Leave a loop or skip an iteration.",
    "loops",
    "intermediate",
    "for (let i = 0; i < 5; i = i + 1) {\n  if (i === 1) continue;\n  if (i === 4) break;\n  console.log(i);\n}",
  ],
  [
    "Function Declaration",
    "Define and call a named function.",
    "functions",
    "beginner",
    "function double(x) {\n  return x * 2;\n}\nconsole.log(double(4));",
  ],
  [
    "Arrow Functions",
    "A compact function syntax.",
    "functions",
    "intermediate",
    "const square = (x) => x * x;\nconsole.log(square(5));",
  ],
  [
    "Recursive Factorial",
    "A function that calls itself.",
    "functions",
    "advanced",
    "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\nconsole.log(factorial(5));",
  ],
  [
    "Closure Counter",
    "A function remembering its scope.",
    "functions",
    "advanced",
    "function makeCounter() {\n  let count = 0;\n  return function () {\n    count = count + 1;\n    return count;\n  };\n}\nconst next = makeCounter();\nconsole.log(next(), next());",
  ],
  [
    "Array Basics",
    "Index, length and push.",
    "arrays",
    "beginner",
    'const items = ["a", "b"];\nitems.push("c");\nconsole.log(items.length, items[0]);',
  ],
  [
    "Array Map",
    "Transform every element.",
    "arrays",
    "intermediate",
    "const nums = [1, 2, 3];\nconsole.log(nums.map((n) => n * 2));",
  ],
  [
    "Array Reduce",
    "Fold an array into one value.",
    "arrays",
    "intermediate",
    "const nums = [1, 2, 3];\nconsole.log(nums.reduce((sum, n) => sum + n, 0));",
  ],
  [
    "Object Literal",
    "Properties and nested values.",
    "objects",
    "beginner",
    'const user = { name: "Ada", age: 36 };\nconsole.log(user.name, user["age"]);',
  ],
  [
    "Destructuring",
    "Unpack arrays and objects.",
    "objects",
    "intermediate",
    "const point = { x: 1, y: 2 };\nconst { x, y } = point;\nconsole.log(x, y);",
  ],
  [
    "Try and Catch",
    "Handle an error without crashing.",
    "errors",
    "intermediate",
    'try {\n  throw new Error("oops");\n} catch (error) {\n  console.log(error.message);\n} finally {\n  console.log("done");\n}',
  ],
  [
    "Template Literals",
    "Interpolate expressions in strings.",
    "strings",
    "beginner",
    'const name = "Ada";\nconsole.log(`Hello, ${name}!`);',
  ],
  [
    "Switch Statement",
    "Choose one of several branches.",
    "conditionals",
    "intermediate",
    'const day = 2;\nswitch (day) {\n  case 1: console.log("Mon"); break;\n  case 2: console.log("Tue"); break;\n  default: console.log("Other");\n}',
  ],
];

type Challenge = readonly [
  slug: string,
  title: string,
  prompt: string,
  starterCode: string,
  category: string,
  difficulty: string,
  xp: number,
];

const CHALLENGES: readonly Challenge[] = [
  [
    "sum-two-numbers",
    "Sum Two Numbers",
    "Return the sum of a and b.",
    "function sum(a, b) {\n  return a + b;\n}",
    "math",
    "beginner",
    10,
  ],
  [
    "fizz-buzz",
    "Fizz Buzz",
    "Print Fizz for multiples of 3, Buzz for 5, both for 15.",
    "for (let i = 1; i <= 15; i = i + 1) {\n  console.log(i);\n}",
    "conditionals",
    "beginner",
    20,
  ],
  [
    "recursive-factorial",
    "Factorial",
    "Compute factorial(5) with recursion.",
    "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
    "functions",
    "intermediate",
    25,
  ],
  [
    "reverse-string",
    "Reverse a String",
    "Reverse the given string without built-in reverse.",
    "function reverse(text) {\n  return text;\n}",
    "strings",
    "beginner",
    15,
  ],
  [
    "max-in-array",
    "Largest Value",
    "Find the largest number in an array.",
    "function maxOf(nums) {\n  return nums[0];\n}",
    "arrays",
    "beginner",
    15,
  ],
  [
    "count-vowels",
    "Count Vowels",
    "Count vowels in a lowercase string.",
    "function countVowels(text) {\n  return 0;\n}",
    "strings",
    "intermediate",
    20,
  ],
  [
    "fibonacci-sequence",
    "Fibonacci",
    "Print the first 8 Fibonacci numbers.",
    "let a = 0, b = 1;\nconsole.log(a);",
    "loops",
    "intermediate",
    25,
  ],
  [
    "is-palindrome",
    "Palindrome",
    "Return true when a string reads the same backwards.",
    "function isPalindrome(text) {\n  return false;\n}",
    "strings",
    "intermediate",
    20,
  ],
  [
    "group-by-category",
    "Group By",
    "Group objects by their category field.",
    "function groupBy(items) {\n  return {};\n}",
    "objects",
    "advanced",
    35,
  ],
  [
    "flatten-array",
    "Flatten",
    "Flatten a nested array one level deep.",
    "function flatten(items) {\n  return items;\n}",
    "arrays",
    "advanced",
    30,
  ],
];

/** Scrypt with a per-record salt. Phase 4 replaces this with Argon2id (4.16). */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export async function* seedDocuments(
  config: SeedConfig,
): AsyncGenerator<SeedDocument> {
  const email = config.adminEmail.trim().toLowerCase();
  if (email === "") throw new Error("SEED_ADMIN_EMAIL is required");
  if (config.adminPassword === "")
    throw new Error("SEED_ADMIN_PASSWORD is required");

  yield {
    collection: "users",
    filter: { email },
    document: {
      name: config.adminName,
      email,
      passwordHash: hashPassword(config.adminPassword),
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    label: `admin:${email}`,
  };

  for (const [title, description, category, difficulty, code] of EXAMPLES) {
    yield {
      collection: "examples",
      filter: { title },
      document: {
        title,
        description,
        code,
        category,
        difficulty,
        tags: [category, difficulty],
        authorEmail: email,
        isPublished: true,
        expectedOutput: [],
        createdAt: new Date().toISOString(),
      },
      label: `example:${title}`,
    };
  }

  for (const [
    slug,
    title,
    prompt,
    starterCode,
    category,
    difficulty,
    xp,
  ] of CHALLENGES) {
    yield {
      collection: "challenges",
      filter: { slug },
      document: {
        slug,
        title,
        prompt,
        starterCode,
        // Filled in by Phase 5 task 5.12 once the grading contract is live.
        tests: [],
        hints: [],
        category,
        difficulty,
        xp,
        authorEmail: email,
        isPublished: true,
        engineVersion: "0.0.0",
        createdAt: new Date().toISOString(),
      },
      label: `challenge:${slug}`,
    };
  }
}

export async function applySeed(
  documents: AsyncIterable<SeedDocument>,
  upsert: Upsert,
): Promise<SeedStats> {
  let inserted = 0;
  let unchanged = 0;

  for await (const item of documents) {
    if (await upsert(item.collection, item.filter, item.document)) {
      inserted += 1;
    } else {
      unchanged += 1;
    }
  }

  return { inserted, unchanged };
}
