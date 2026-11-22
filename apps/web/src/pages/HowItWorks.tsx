const HowItWorks = () => {
  const steps = [
    {
      title: "1) Parse Your Code",
      description:
        "Your JavaScript is split line by line. Empty lines and comments are ignored so the engine can focus on meaningful instructions.",
    },
    {
      title: "2) Detect Operations",
      description:
        "The parser tags each line as assignment, console log, or general execution. This creates a structured execution plan.",
    },
    {
      title: "3) Simulate Safely",
      description:
        "A lightweight simulator evaluates expressions and updates a virtual variable state object, one instruction at a time.",
    },
    {
      title: "4) Build Execution Timeline",
      description:
        "Each simulated instruction becomes a visualization step with line number, action text, and current variables snapshot.",
    },
    {
      title: "5) Show Logs & Flow",
      description:
        "The dashboard displays the timeline and console outputs so you can move forward/backward and inspect how values change.",
    },
  ];

  return (
    <div className="min-h-[82vh] py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-lg backdrop-blur-sm md:p-10 dark:border-slate-800 dark:bg-slate-900/75">
        <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-700 uppercase dark:bg-cyan-900/50 dark:text-cyan-200">
          Learning Guide
        </p>

        <h1 className="text-3xl font-black text-slate-900 md:text-5xl dark:text-white">
          How Visualization Works
        </h1>

        <p className="mt-4 text-slate-600 dark:text-slate-300">
          JS Flow Visualizer simulates your code execution in small steps so you
          can understand variable updates and console output clearly.
        </p>

        <div className="mt-8 space-y-4">
          {steps.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
          <h3 className="font-bold text-amber-800 dark:text-amber-300">
            Current Scope
          </h3>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
            This visualizer is currently best for assignment statements and
            console logging patterns. Complex control flow and advanced language
            features can be added incrementally.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
