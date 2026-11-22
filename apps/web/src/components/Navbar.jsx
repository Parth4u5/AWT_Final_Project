import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../utils/auth";

const Navbar = ({ darkMode, onToggleTheme }) => {
  const navigate = useNavigate();

  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border border-slate-200/70 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md transition dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        {/* Logo */}
        <h1
          onClick={() => navigate("/")}
          className="cursor-pointer text-xl font-black tracking-tight text-slate-900 dark:text-white"
        >
          JS Flow
        </h1>

        {/* Links */}
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:gap-5 md:text-base dark:text-slate-200">
          <Link
            to="/"
            className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            Home
          </Link>

          <Link
            to="/how-it-works"
            className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            How It Works
          </Link>

          <Link
            to="/contact"
            className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            Contact
          </Link>

          {/* NOT LOGGED IN */}
          {!user && (
            <>
              <Link
                to="/login"
                className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-cyan-600 px-4 py-1.5 text-white shadow-sm transition hover:bg-cyan-700"
              >
                Register
              </Link>
            </>
          )}

          {/* LOGGED IN */}
          {user && (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
              >
                Dashboard
              </Link>

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-purple-400/20 transition hover:from-purple-700 hover:to-indigo-700"
                >
                  🔐 Admin Panel
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-4 py-1.5 text-white shadow-sm transition hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}

          <button
            onClick={onToggleTheme}
            className="ml-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 uppercase transition hover:bg-slate-100 md:text-sm dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
