import type { Step } from "@jsflow/engine";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { fetchExamplesApi } from "../api/Examplesapi";
import CodeWorkspace from "../components/CodeWorkspace";
import ExecutionLog from "../components/ExecutionLog";
import VisualizerStage from "../components/VisualizerStage";
import { simulateCodeFlow } from "../engine/simulator";
import type { RemoteExample } from "../types";

interface UserDashboardProps {
  darkMode?: boolean;
}

const UserDashboard = ({ darkMode }: UserDashboardProps) => {
  void darkMode;
  const beginnerExamples = useMemo(
    () => [
      {
        _id: "beginner-1",
        title: "Variable Update Basics",
        code: `let score = 5;
score = score + 3;
console.log(score);`,
      },
      {
        _id: "beginner-2",
        title: "Simple Math Chain",
        code: `let apples = 10;
apples = apples - 2;
apples = apples + 4;
console.log(apples);`,
      },
      {
        _id: "beginner-3",
        title: "Dependent Values",
        code: `const price = 200;
const discount = 50;
const finalPrice = price - discount;
console.log(finalPrice);`,
      },
      {
        _id: "beginner-4",
        title: "String Build",
        code: `let first = "JS";
let second = "Flow";
let message = first + " " + second;
console.log(message);`,
      },
    ],
    [],
  );

  const [steps, setSteps] = useState<Step[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState(
    beginnerExamples[0]?._id ?? "",
  );
  const [editorCode, setEditorCode] = useState(beginnerExamples[0]?.code ?? "");
  const [examples, setExamples] = useState(beginnerExamples);

  useEffect(() => {
    const loadExamples = async () => {
      try {
        const remote = await fetchExamplesApi();
        if (remote.length > 0) {
          setExamples([...beginnerExamples, ...remote]);
        }
      } catch {
        setExamples(beginnerExamples);
      }
    };

    loadExamples();
  }, [beginnerExamples]);

  const handleRun = (code: string) => {
    const result = simulateCodeFlow(code);
    setSteps(result.steps);
    setLogs(result.logs);
    setCurrentStep(0);
  };

  const handleSelectExample = (example: RemoteExample) => {
    setSelectedExampleId(example._id);
    setEditorCode(example.code);
    setSteps([]);
    setLogs([]);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setSteps([]);
    setLogs([]);
    setCurrentStep(0);
  };

  const hasSteps = steps.length > 0;
  const canGoPrev = hasSteps && currentStep > 0;
  const canGoNext = hasSteps && currentStep < steps.length - 1;
  const progressPercent = hasSteps
    ? Math.round(((currentStep + 1) / steps.length) * 100)
    : 0;

  return (
    <div className="min-h-screen p-5 text-slate-800 transition dark:text-slate-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            JS Flow Visualizer
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Write code → Run → Visualize execution
          </p>
        </div>

        <button
          onClick={() => setIsExamplesOpen((prev) => !prev)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {isExamplesOpen ? "Hide Examples" : "Examples"}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Total steps
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {steps.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Current line
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {hasSteps ? steps[currentStep]?.line : "-"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Log entries
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {logs.length}
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {isExamplesOpen && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Example Codes
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Beginner-friendly snippets to understand execution flow quickly.
            </p>

            <div className="mt-4 max-h-115 space-y-2 overflow-y-auto pr-1">
              {examples.map((example) => {
                const isSelected = selectedExampleId === example._id;

                return (
                  <button
                    key={example._id}
                    onClick={() => handleSelectExample(example)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-50 dark:border-cyan-500 dark:bg-cyan-950/40"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {example.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {example.code}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LEFT: Code Editor */}
        <div
          className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
            isExamplesOpen ? "lg:col-span-1" : "lg:col-span-2"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Code Editor</h2>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
            <CodeWorkspace onRun={handleRun} selectedCode={editorCode} />
          </div>
        </div>

        {/* RIGHT: Visualizer */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold">Execution Flow</h2>

          <div className="flex-1 rounded-xl border border-slate-300 p-2 dark:border-slate-700">
            <VisualizerStage steps={steps} currentStep={currentStep} />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-cyan-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <button
              disabled={!hasSteps}
              onClick={() => setCurrentStep(0)}
              className="rounded-lg bg-slate-200 px-4 py-1.5 text-sm transition hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              First
            </button>

            <button
              disabled={!canGoPrev}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="rounded-lg bg-slate-200 px-4 py-1.5 text-sm transition hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              ◀ Prev
            </button>

            <button
              disabled={!canGoNext}
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="rounded-lg bg-slate-200 px-4 py-1.5 text-sm transition hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Next ▶
            </button>

            <button
              disabled={!hasSteps}
              onClick={() => setCurrentStep(steps.length - 1)}
              className="rounded-lg bg-slate-200 px-4 py-1.5 text-sm transition hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Last
            </button>

            <button
              disabled={!hasSteps && logs.length === 0}
              onClick={handleReset}
              className="rounded-lg bg-rose-500 px-4 py-1.5 text-sm text-white transition hover:bg-rose-600 disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Learning & Help
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            New here? Learn how flow simulation works, then reach out if you
            need help.
          </p>

          <div className="mt-4 space-y-3">
            <Link
              to="/how-it-works"
              className="block rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:bg-cyan-900/50"
            >
              Read: How visualization works
            </Link>

            <Link
              to="/contact"
              className="block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Execution Log</h2>

          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white transition hover:bg-red-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-300 p-2 dark:border-slate-700">
          <ExecutionLog logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
