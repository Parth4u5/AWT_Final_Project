import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate } from "react-router";

import { registerUser } from "../utils/auth";

interface RegisterProps {
  darkMode?: boolean;
}

const Register = ({ darkMode }: RegisterProps) => {
  void darkMode;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser(formData);

      if (data.message === "User registered successfully") {
        alert(data.message);
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[82vh] items-center justify-center transition">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <h2 className="mb-3 text-center text-3xl font-black text-slate-900 dark:text-white">
            Create Account
          </h2>

          <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Join JS Flow and start visualizing your code
          </p>

          {/* Name */}
          <div className="mb-4">
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-600 py-2.5 font-semibold text-white shadow-lg shadow-cyan-400/25 transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Login redirect */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
