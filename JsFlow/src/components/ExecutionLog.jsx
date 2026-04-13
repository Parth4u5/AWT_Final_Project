import React from "react";

const ExecutionLog = ({ logs }) => {
    return (
        <div className="p-4 h-full flex flex-col bg-gray-100 dark:bg-gray-900 transition">

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Execution Log
                </h3>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {logs.length} entries
                </span>
            </div>

            {/* Content */}
            {logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center 
                                text-gray-500 dark:text-gray-400 text-sm 
                                border border-dashed border-gray-300 dark:border-gray-700 
                                rounded-xl">
                    No logs yet
                </div>
            ) : (
                <div className="flex-1 bg-black text-green-400 
                                border border-gray-300 dark:border-gray-700 
                                rounded-xl p-3 overflow-auto shadow-inner">

                    <ul className="text-sm font-mono space-y-1">

                        {logs.map((log, index) => (
                            <li
                                key={index}
                                className="flex gap-3 items-start 
                                           border-b border-gray-800 pb-1 
                                           last:border-none 
                                           hover:bg-gray-900 px-2 py-1 rounded 
                                           transition duration-150"
                            >
                                {/* Line number */}
                                <span className="text-gray-500 w-6 text-right">
                                    {index + 1}
                                </span>

                                {/* Log text */}
                                <span className="flex-1 break-words">
                                    {log}
                                </span>
                            </li>
                        ))}

                    </ul>
                </div>
            )}
        </div>
    );
};

export default ExecutionLog;