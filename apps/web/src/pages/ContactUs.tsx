import { type ChangeEvent, type FormEvent, useState } from "react";

const ContactUs = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert("Please fill all fields before submitting.");
      return;
    }

    alert("Thanks for contacting us. We received your message.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-[82vh] py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-lg backdrop-blur-sm md:p-10 dark:border-slate-800 dark:bg-slate-900/75">
        <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/50 dark:text-emerald-200">
          Support
        </p>

        <h1 className="text-3xl font-black text-slate-900 md:text-5xl dark:text-white">
          Contact Us
        </h1>

        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Questions, bug reports, or feature ideas are welcome. Send us a
          message and we will get back to you.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your email"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what you need..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white shadow-lg shadow-emerald-400/25 transition hover:bg-emerald-700"
            >
              Send Message
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Help
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Check backend status if requests fail.</li>
              <li>Use starter snippets in dashboard to learn flow faster.</li>
              <li>Visit How It Works for visualization details.</li>
            </ul>

            <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/40">
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                Support Email
              </p>
              <p className="text-sm text-cyan-800 dark:text-cyan-200">
                jerry8u555@gmail.com
              </p>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Connect With Us
              </p>
              <div className="flex items-center justify-start gap-4">
                <a
                  href="https://github.com/Parth4u5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-12 transform items-center justify-center rounded-full bg-slate-100 transition hover:scale-110 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  title="Visit our GitHub"
                >
                  <svg
                    className="h-6 w-6 text-slate-800 dark:text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>

                <a
                  href="https://www.linkedin.com/in/parth-thanki-1876b031a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-12 transform items-center justify-center rounded-full bg-slate-100 transition hover:scale-110 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  title="Visit our LinkedIn"
                >
                  <svg
                    className="h-6 w-6 text-slate-800 dark:text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.249-.129.597-.129.946v5.421h-3.554s.05-8.746 0-9.637h3.554v1.364c.429-.662 1.196-1.608 2.905-1.608 2.124 0 3.715 1.39 3.715 4.374v5.507zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.704 0-.951.77-1.704 1.963-1.704 1.193 0 1.923.753 1.938 1.704 0 .946-.745 1.704-1.986 1.704zm1.581 11.597H3.765V9.815h3.153v10.637zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
