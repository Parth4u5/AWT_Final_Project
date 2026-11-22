interface ExecutionLogProps {
  logs: string[];
}

const ExecutionLog = ({ logs }: ExecutionLogProps) => {
  return (
    <div className="flex h-full flex-col bg-gray-100 p-4 transition dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Execution Log
        </h3>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {logs.length} entries
        </span>
      </div>

      {/* Content */}
      {logs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No logs yet
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-gray-300 bg-black p-3 text-green-400 shadow-inner dark:border-gray-700">
          <ul className="space-y-1 font-mono text-sm">
            {logs.map((log, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded border-b border-gray-800 px-2 py-1 pb-1 transition duration-150 last:border-none hover:bg-gray-900"
              >
                {/* Line number */}
                <span className="w-6 text-right text-gray-500">
                  {index + 1}
                </span>

                {/* Log text */}
                <span className="flex-1 break-words">{log}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExecutionLog;
