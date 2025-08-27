import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check if user is authenticated on app load and configure axios defaults
  useEffect(() => {
    const checkAuth = async () => {
      // Configure axios defaults first
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log(
          "🔐 Axios Authorization header set:",
          axios.defaults.headers.common["Authorization"]
        );

        try {
          const response = await axios.get("http://localhost:5001/api/auth/me");
          setUser(response.data.user);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common["Authorization"];
        }
      } else {
        delete axios.defaults.headers.common["Authorization"];
        console.log("🔐 Axios Authorization header cleared");
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/login",
        {
          email,
          password,
        }
      );

      if (response.data.requiresPasswordReset) {
        return {
          success: true,
          requiresPasswordReset: true,
          userId: response.data.userId,
          email: response.data.email,
          role: response.data.role,
        };
      }

      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      await axios.post("http://localhost:5001/api/auth/reset-password", {
        userId,
        newPassword,
      });

      toast.success(
        "Password updated successfully! Please login with your new password."
      );
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Password reset failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully");
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post("http://localhost:5001/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Password change failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
