import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import Menu from "./components/Menu";
import TotalPenjualan from "./components/TotalPenjualan";
import UserProfile from "./components/UserProfile";
import Sidebar from "./components/Sidebar";
import { apiService } from "./utils/api";
import "./styles/style.css";

const App = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Token exists, validate it
          const user = await apiService.getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
          setCurrentView("menu");
        }
      } catch (error) {
        console.log('User not authenticated or token invalid');
        apiService.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleRegisterSuccess = (userData) => {
    setCurrentView("login");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView("menu");
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView("dashboard");
      apiService.clearToken();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      );
    }

    switch (currentView) {
      case "login":
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentView("dashboard")}
            onRegisterClick={() => setCurrentView("register")}
            users={[]}
          />
        );
      case "register":
        return (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onBack={() => setCurrentView("login")}
          />
        );
      case "menu":
        return (
          <Menu
            onLogout={handleLogout}
            onFallbackBack={() => setCurrentView("menu")}
          />
        );
      case "total-penjualan":
        return (
          <TotalPenjualan
            onBack={() => setCurrentView("menu")}
          />
        );
      case "user-profile":
        return (
          <UserProfile
            onBack={() => setCurrentView("menu")}
            currentUser={currentUser}
            users={[]}
            onAddNewUser={() => {}}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
          />
        );
      default:
        return <Dashboard onLoginClick={() => setCurrentView("login")} />;
    }
  };

  return (
    <div className={`app-layout ${isAuthenticated ? (sidebarOpen ? "sidebar-open" : "sidebar-closed") : "no-sidebar"}`}>
      {/* Sidebar hanya dirender kalau sudah login */}
      {isAuthenticated && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(s => !s)}
          onLogout={handleLogout}
          onNavigate={(view) => setCurrentView(view)}
          currentUser={currentUser}
        />
      )}

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
