import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPages from "./AuthPages";
import SearchPage from "./SearchPage";
import { createUser } from "./domain";

export default function App() {
  const navigate = useNavigate();

  // Keep the user logged in when the page is refreshed
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("user");
      return saved ? createUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (data) => {
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(createUser(data.user));
    navigate("/home", { replace: true }); // after login -> Home page
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true }); // after logout -> Auth page
  };

  return (
    <Routes>
      {/* Auth page first. If already logged in, skip straight to Home */}
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <AuthPages onLoggedIn={handleLogin} />} />

      {/* Home page is protected: not logged in -> redirected to /login */}
      <Route path="/home" element={user ? <SearchPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />

      {/* Any other address (including "/") goes to the right place */}
      <Route path="*" element={<Navigate to={user ? "/home" : "/login"} replace />} />
    </Routes>
  );
}