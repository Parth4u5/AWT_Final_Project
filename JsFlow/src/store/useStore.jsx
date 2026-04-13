import { useEffect, useMemo, useState } from "react";
import { getStoredUser, hasToken, meApi } from "../api/Authapi.jsx";

export const useAuthStore = () => {
    const [user, setUser] = useState(getStoredUser());
    const [loading, setLoading] = useState(false);

    const isAuthenticated = useMemo(() => Boolean(user) && hasToken(), [user]);

    const refreshUser = async () => {
        if (!hasToken()) {
            setUser(null);
            return;
        }

        try {
            setLoading(true);
            const data = await meApi();
            setUser(data.user || null);
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }
        } catch {
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return {
        user,
        loading,
        isAuthenticated,
        refreshUser,
        setUser,
    };
};
