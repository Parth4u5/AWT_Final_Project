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
    const [editingExample, setEditingExample] = useState(null);

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
            user.email.toLowerCase().includes(searchUser.toLowerCase())
    );

    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = users.length - adminCount;

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 p-4 md:p-8">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                    🔐 Admin Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Welcome back! Manage users, examples, and site content
                </p>
            </div>

            {/* Stats Section */}
            {activeTab === "stats" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 p-6 shadow-sm dark:border-purple-800 dark:from-purple-900/30 dark:to-purple-900/10">
                        <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-purple-700 dark:text-purple-200">{users.length}</p>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-indigo-100 p-6 shadow-sm dark:border-indigo-800 dark:from-indigo-900/30 dark:to-indigo-900/10">
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Admins</p>
                        <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{adminCount}</p>
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-linear-to-br from-violet-50 to-violet-100 p-6 shadow-sm dark:border-violet-800 dark:from-violet-900/30 dark:to-violet-900/10">
                        <p className="text-sm text-violet-600 dark:text-violet-300 mb-1">Regular Users</p>
                        <p className="text-3xl font-bold text-violet-700 dark:text-violet-200">{userCount}</p>
                    </div>

                    <div className="rounded-xl border border-fuchsia-200 bg-linear-to-br from-fuchsia-50 to-fuchsia-100 p-6 shadow-sm dark:border-fuchsia-800 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10">
                        <p className="text-sm text-fuchsia-600 dark:text-fuchsia-300 mb-1">Code Examples</p>
                        <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-200">{examples.length}</p>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-300 dark:border-slate-700">
                {["stats", "users", "examples", "create"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 font-semibold capitalize transition border-b-2 ${activeTab === tab
                            ? "border-purple-600 text-purple-600 dark:text-purple-400"
                            : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                    >
                        {tab === "create" ? "➕ Create Example" : tab}
                    </button>
                ))}
            </div>

            {loading && <p className="text-center text-slate-500 py-8">Loading data...</p>}

            {/* Create Example Tab */}
            {activeTab === "create" && !loading && (
                <div className="rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg dark:border-purple-800 dark:bg-slate-900/90 backdrop-blur-sm mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Create New Code Example
                    </h2>
                    <form onSubmit={handleCreateExample} className="space-y-4">
                        <input
                            value={newExample.title}
                            onChange={(e) => setNewExample((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Example title"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <textarea
                            value={newExample.code}
                            onChange={(e) => setNewExample((prev) => ({ ...prev, code: e.target.value }))}
                            placeholder="Enter JavaScript code..."
                            rows={6}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                <div className="rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg dark:border-purple-800 dark:bg-slate-900/90 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Manage Users ({filteredUsers.length})
                    </h2>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-linear-to-r from-purple-100 to-indigo-100 text-slate-700 dark:from-purple-900/40 dark:to-indigo-900/40 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold">Role</th>
                                    <th className="px-4 py-3 font-semibold text-center">Action</th>
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
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === "admin"
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
                                                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 hover:bg-red-500/30 transition text-xs font-semibold dark:text-red-400"
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
                <div className="rounded-2xl border border-purple-300 bg-white/90 p-8 shadow-lg dark:border-purple-800 dark:bg-slate-900/90 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Code Examples ({examples.length})
                    </h2>

                    <div className="space-y-4">
                        {examples.map((ex) => (
                            <div
                                key={ex._id}
                                className="rounded-xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {ex.title}
                                    </h3>
                                    <button
                                        onClick={() => handleDeleteExample(ex._id)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 hover:bg-red-500/30 transition text-xs font-semibold dark:text-red-400"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                                <pre className="text-xs bg-slate-900/90 text-green-400 p-3 rounded-lg overflow-x-auto max-h-32">
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