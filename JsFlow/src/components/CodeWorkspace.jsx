import { useEffect, useState } from "react";

const CodeWorkspace = ({ onRun, selectedCode = "" }) => {
    const starterSnippets = {
        basics: `let count = 1;
count = count + 2;
console.log(count);`,
        mathFlow: `const a = 10;
const b = 4;
const total = a * b;
console.log(total);`,
        chained: `let price = 100;
price = price - 15;
price = price + 20;
console.log(price);`,
    };

    const [code, setCode] = useState(starterSnippets.basics);

    useEffect(() => {
        if (selectedCode) {
            setCode(selectedCode);
        }
    }, [selectedCode]);

    const handleRun = () => {
        if (!code.trim()) return;
        onRun(code);
    };

    const handleLoadSnippet = (key) => {
        setCode(starterSnippets[key]);
    };

    const handleClear = () => {
        setCode("");
    };

    const lineCount = code ? code.split("\n").length : 0;

    return (
        <div className="p-4 h-full flex flex-col bg-gray-100 dark:bg-gray-900 transition">

            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Code Editor
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        Clear
                    </button>

                    <button
                        onClick={handleRun}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg 
                               hover:bg-blue-700 active:scale-95 
                               transition duration-200 shadow-md hover:shadow-lg"
                    >
                        ▶ Run
                    </button>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                    onClick={() => handleLoadSnippet("basics")}
                    className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                    Basic Flow
                </button>
                <button
                    onClick={() => handleLoadSnippet("mathFlow")}
                    className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                    Math Example
                </button>
                <button
                    onClick={() => handleLoadSnippet("chained")}
                    className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                    Chained Updates
                </button>
            </div>

            {/* Editor Container */}
            <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-300 dark:border-gray-700">

                <textarea
                    className="w-full h-full p-4 resize-none outline-none 
                               bg-black text-green-400 font-mono text-sm
                               placeholder-gray-500
                               focus:ring-2 focus:ring-blue-500 
                               transition duration-200"
                    placeholder="// Write your JavaScript code here...\n\nlet x = 1;\nx = x + 1;\nconsole.log(x);"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />

            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{lineCount} lines</span>
                <span>{code.length} characters</span>
            </div>

        </div>
    );
};

export default CodeWorkspace;