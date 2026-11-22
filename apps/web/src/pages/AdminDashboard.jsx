import { useEffect, useState } from "react";
import {
  createExampleApi,
  deleteExampleApi,
  deleteUserApi,
  fetchExamplesApi,
  fetchUsersApi,
} from "../api/Examplesapi.jsx";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stats");
  const [newExample, setNewExample] = useState({ title: "", code: "" });
  const [searchUser, setSearchUser] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, examplesData] = await Promise.all([
        fetchUsersApi(),
        fetchExamplesApi(),
      ]);
      setUsers(usersData);
      setExamples(examplesData);
    } catch (error) {
      alert(error.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUserApi(id);
        setUsers((prev) => prev.filter((user) => user._id !== id));
      } catch (error) {
        alert(error.message || "Failed to delete user");
      }
    }
  };

  const handleDeleteExample = async (id) => {
    if (confirm("Are you sure you want to delete this example?")) {
      try {
        await deleteExampleApi(id);
        setExamples((prev) => prev.filter((ex) => ex._id !== id));
      } catch (error) {
        alert(error.message || "Failed to delete example");
      }
    }
  };

  const handleCreateExample = async (e) => {
    e.preventDefault();

    if (!newExample.title.trim() || !newExample.code.trim()) {
      alert("Title and code are required");
      return;
    }

    try {
      const created = await createExampleApi(newExample);
      setExamples((prev) => [created, ...prev]);
      setNewExample({ title: "", code: "" });
      alert("Example created successfully!");
    } catch (error) {
      alert(error.message || "Failed to create example");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.length - adminCount;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50 to-slate-50 p-4 md:p-8 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-black text-slate-900 dark:text-white">
          🔐 Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome back! Manage users, examples, and site content
        </p>
      </div>

      {/* Stats Section */}
      {activeTab === "stats" && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 p-6 shadow-sm dark:border-purple-800 dark:from-purple-900/30 dark:to-purple-900/10">
            <p className="mb-1 text-sm text-purple-600 dark:text-purple-300">
              Total Users
            </p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-200">
              {users.length}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-indigo-100 p-6 shadow-sm dark:border-indigo-800 dark:from-indigo-900/30 dark:to-indigo-900/10">
            <p className="mb-1 text-sm text-indigo-600 dark:text-indigo-300">
              Admins
            </p>
            <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">
              {adminCount}
            </p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-linear-to-br from-violet-50 to-violet-100 p-6 shadow-sm dark:border-violet-800 dark:from-violet-900/30 dark:to-violet-900/10">
            <p className="mb-1 text-sm text-violet-600 dark:text-violet-300">
              Regular Users
            </p>
            <p className="text-3xl font-bold text-violet-700 dark:text-violet-200">
              {userCount}
            </p>
          </div>

          <div className="rounded-xl border border-fuchsia-200 bg-linear-to-br from-fuchsia-50 to-fuchsia-100 p-6 shadow-sm dark:border-fuchsia-800 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10">
            <p className="mb-1 text-sm text-fuchsia-600 dark:text-fuchsia-300">
              Code Examples
            </p>
            <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-200">
              {examples.length}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-slate-300 dark:border-slate-700">
        {["stats", "users", "examples", "create"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 font-semibold capitalize transition ${
              activeTab === tab
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab === "create" ? "➕ Create Example" : tab}
          </button>
        ))}
      </div>

      {loading && (
        <p className="py-8 text-center text-slate-500">Loading data...</p>
      )}

      {/* Create Example Tab */}
      {activeTab === "create" && !loading && (
        <div className="mb-8 rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-purple-800 dark:bg-slate-900/90">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Create New Code Example
          </h2>
          <form onSubmit={handleCreateExample} className="space-y-4">
            <input
              value={newExample.title}
              onChange={(e) =>
                setNewExample((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Example title"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <textarea
              value={newExample.code}
              onChange={(e) =>
                setNewExample((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder="Enter JavaScript code..."
              rows={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-slate-800 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-400/25 transition hover:from-purple-700 hover:to-indigo-700"
            >
              Create Example
            </button>
          </form>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && !loading && (
        <div className="rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-purple-800 dark:bg-slate-900/90">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Manage Users ({filteredUsers.length})
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-300 bg-linear-to-r from-purple-100 to-indigo-100 text-slate-700 dark:border-slate-700 dark:from-purple-900/40 dark:to-indigo-900/40 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t border-slate-200 transition hover:bg-purple-50/50 dark:border-slate-700 dark:hover:bg-purple-900/10"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="inline-flex items-center rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/30 dark:text-red-400"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === "examples" && !loading && (
        <div className="rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg backdrop-blur-sm dark:border-purple-800 dark:bg-slate-900/90">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Code Examples ({examples.length})
          </h2>

          <div className="space-y-4">
            {examples.map((ex) => (
              <div
                key={ex._id}
                className="rounded-xl border border-slate-300 bg-slate-50 p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {ex.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteExample(ex._id)}
                    className="inline-flex items-center rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/30 dark:text-red-400"
                  >
                    🗑️ Delete
                  </button>
                </div>
                <pre className="max-h-32 overflow-x-auto rounded-lg bg-slate-900/90 p-3 text-xs text-green-400">
                  <code>{ex.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
