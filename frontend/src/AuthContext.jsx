import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const API = "http://localhost:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("taskforge_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("taskforge_user")
      ) || null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("taskforge_theme") || "dark"
  );

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("taskforge_theme", theme);
  }, [theme]);

  // Login
  const login = (newToken, newUser) => {
    localStorage.setItem(
      "taskforge_token",
      newToken
    );

    localStorage.setItem(
      "taskforge_user",
      JSON.stringify(newUser)
    );

    setToken(newToken);
    setUser(newUser);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("taskforge_token");
    localStorage.removeItem("taskforge_user");

    setToken(null);
    setUser(null);
  };

  // Refresh user information from backend
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Token expired / invalid
      if (
        response.status === 401 ||
        response.status === 403
      ) {
        logout();
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setUser(data);

      localStorage.setItem(
        "taskforge_user",
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Failed to refresh user:",
        error
      );
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      refreshUser,
      theme,
      setTheme,
      isAuthenticated: Boolean(token)
    }),
    [token, user, theme]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;