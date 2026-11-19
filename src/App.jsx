import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPages from "./AuthPages";
import LandingPage from "./LandingPage";
import SearchPage from "./SearchPage";
import TransportPage from "./TransportPage";
import RestaurantPage from "./RestaurantPage";
import AdminDashboard from "./AdminDashboard";
import { createUser, ROLES } from "./domain";

// Only logged-in users with an allowed role can open the page
function Guard({ user, allow, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={user.homePath()} replace />;
  return children;
}

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
    const u = createUser(data.user);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(u);
    navigate(u.homePath(), { replace: true }); // admin -> /admin, others -> /home
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const people = [ROLES.USER, ROLES.VENDOR]; // roles that use the normal site
  const home = () => navigate("/home");

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.homePath()} replace /> : <AuthPages onLoggedIn={handleLogin} />} />

      <Route path="/home" element={<Guard user={user} allow={people}><LandingPage user={user} onLogout={handleLogout} /></Guard>} />
      <Route path="/accommodation" element={<Guard user={user} allow={people}><SearchPage user={user} onLogout={handleLogout} onBack={home} /></Guard>} />
      <Route path="/transportation" element={<Guard user={user} allow={people}><TransportPage user={user} onLogout={handleLogout} onBack={home} /></Guard>} />
      <Route path="/restaurant" element={<Guard user={user} allow={people}><RestaurantPage user={user} onLogout={handleLogout} onBack={home} /></Guard>} />

      <Route path="/admin" element={<Guard user={user} allow={[ROLES.ADMIN]}><AdminDashboard user={user} onLogout={handleLogout} /></Guard>} />

      <Route path="*" element={<Navigate to={user ? user.homePath() : "/login"} replace />} />
    </Routes>
  );
}
