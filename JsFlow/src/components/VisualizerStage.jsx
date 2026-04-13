import React from "react";

const VisualizerStage = ({ steps, currentStep }) => {
    const step = steps[currentStep];

    return (
        <div className="p-4 h-full flex flex-col bg-gray-100 dark:bg-gray-900 transition">

            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Visualizer
                </h3>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Step {step ? currentStep + 1 : 0} / {steps.length}
                </span>
            </div>

            {/* Empty State */}
            {!step ? (
                <div className="flex-1 flex items-center justify-center 
                                text-gray-500 dark:text-gray-400 text-sm 
                                border border-dashed border-gray-300 dark:border-gray-700 
                                rounded-xl">
                    No execution yet
                </div>
            ) : (
                <div className="flex-1 bg-white dark:bg-gray-800 
                                border border-gray-300 dark:border-gray-700 
                                rounded-xl p-4 shadow-md 
                                transition duration-300">

                    {/* Executing Line */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Executing Line
                        </p>

                        <p className="text-2xl font-bold text-blue-600 
                                      animate-pulse">
                            {step.line}
                        </p>
                    </div>

                    {/* Action */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Action
                        </p>

                        <p className="text-gray-800 dark:text-gray-200 font-medium 
                                      bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                            {step.action}
                        </p>
                    </div>

                    {/* Variables */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Variables
                        </p>

                        <div className="bg-black text-green-400 
                                        border border-gray-300 dark:border-gray-700 
                                        rounded-lg p-3 overflow-auto shadow-inner">

                            <pre className="whitespace-pre-wrap text-sm font-mono">
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