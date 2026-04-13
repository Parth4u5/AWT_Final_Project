import React from 'react'
import { useNavigate } from "react-router-dom"
import { getCurrentUser } from "../utils/auth";

const Home = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();

    return (
        <div className="min-h-[82vh] py-10 transition">

            <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/70 bg-white/75 p-8 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 md:p-12">
                <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                    JavaScript Execution Playground
                </p>

                <h1 className="mb-4 text-4xl font-black leading-tight text-slate-900 dark:text-white md:text-6xl">
                    JS Flow Visualizer
                </h1>

                <p className="mx-auto mb-10 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
                    Visualize JavaScript execution step by step. Understand variable state changes,
                    inspect logs, and learn code flow faster.
                </p>

                {/* Buttons */}
                <div className="mb-12 flex flex-wrap justify-center gap-4">

                    {!user ? (
                        <>
                            <button
                                onClick={() => navigate("/login")}
                                className="rounded-xl bg-cyan-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-cyan-400/30 transition hover:-translate-y-0.5 hover:bg-cyan-700"
                            >
                                Login
                            </button>

                            <button
                                onClick={() => navigate("/register")}
                                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-emerald-400/30 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                            >
                                Go to Workspace
                            </button>

                            {user.role === "admin" && (
                                <button
                                    onClick={() => navigate("/admin")}
                                    className="rounded-xl bg-amber-500 px-6 py-2.5 font-semibold text-white shadow-lg shadow-amber-300/40 transition hover:-translate-y-0.5 hover:bg-amber-600"
                                >
                                    Admin Panel
                                </button>
                            )}
                        </>
                    )}

                    <button
                        onClick={() => navigate("/how-it-works")}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        How It Works
                    </button>

                    <button
                        onClick={() => navigate("/contact")}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Contact Us
                    </button>

                </div>

                {/* Features */}
                <div className="grid gap-6 md:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                            Code Visualization
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Follow execution line by line with clear step snapshots.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                            Easy Learning
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Understand scope, assignments, and logs without guessing.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                            Debug Smarter
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Inspect variable states over time to catch logic bugs quickly.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Home;