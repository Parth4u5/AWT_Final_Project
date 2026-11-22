import React from "react";

const VisualizerStage = ({ steps, currentStep }) => {
  const step = steps[currentStep];

  return (
    <div className="flex h-full flex-col bg-gray-100 p-4 transition dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Visualizer
        </h3>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {step ? currentStep + 1 : 0} / {steps.length}
        </span>
      </div>

      {/* Empty State */}
      {!step ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No execution yet
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-gray-300 bg-white p-4 shadow-md transition duration-300 dark:border-gray-700 dark:bg-gray-800">
          {/* Executing Line */}
          <div className="mb-4">
            <p className="text-xs tracking-wide text-gray-500 uppercase">
              Executing Line
            </p>

            <p className="animate-pulse text-2xl font-bold text-blue-600">
              {step.line}
            </p>
          </div>

          {/* Action */}
          <div className="mb-4">
            <p className="text-xs tracking-wide text-gray-500 uppercase">
              Action
            </p>

            <p className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {step.action}
            </p>
          </div>

          {/* Variables */}
          <div>
            <p className="mb-2 text-xs tracking-wide text-gray-500 uppercase">
              Variables
            </p>

            <div className="overflow-auto rounded-lg border border-gray-300 bg-black p-3 text-green-400 shadow-inner dark:border-gray-700">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(step.variables, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizerStage;
