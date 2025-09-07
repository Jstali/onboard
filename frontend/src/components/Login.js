import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password change form state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [resetData, setResetData] = useState(null);

  const { login, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.requiresPasswordReset) {
        // Show password change form instead of redirecting
        setResetData({
          userId: result.userId,
          email: result.email,
          role: result.role,
        });
        setShowPasswordChange(true);
        setPassword("");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setPasswordChangeLoading(true);

    try {
      const result = await resetPassword(resetData.userId, newPassword);
      if (result.success) {
        toast.success(
          "Password set successfully! Please login with your new password."
        );
        // Reset the form and show login again
        setShowPasswordChange(false);
        setNewPassword("");
        setConfirmPassword("");
        setResetData(null);
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Password change error:", error);
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const goBackToLogin = () => {
    setShowPasswordChange(false);
    setNewPassword("");
    setConfirmPassword("");
    setResetData(null);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="login-container">
      <div className="stars"></div> {/* Starry background */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="login-card animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl gradient-tertiary">
              <span className="text-3xl font-bold text-blue-950">N</span>
            </div>
            <h1 className="heading-1 text-blue-100">Welcome Back</h1>
            <p className="body-small text-blue-300">
              Sign in to your Future Foresight portal
            </p>
          </div>

          {!showPasswordChange ? (
            // Login Form
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="form-label text-blue-100">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" />
                    <input
                      type="email"
                      required
                      className="input-field pl-12 bg-purple-400/20 border-purple-300 focus:border-blue-400 focus:ring-blue-400 text-blue-100 placeholder-blue-300"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-blue-100">Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="input-field pl-12 pr-12 bg-purple-400/20 border-purple-300 focus:border-blue-400 focus:ring-blue-400 text-blue-100 placeholder-blue-300"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-400 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg shadow-2xl"
                style={{
                  background: loading ? "rgba(141, 233, 113, 0.7)" : "",
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-blue-950 mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-500 font-medium text-sm transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => console.log("Forgot password clicked")}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
            // Password Change Form
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaCheck className="text-2xl text-blue-950" />
                </div>
                <h2 className="heading-3 text-blue-100">Set New Password</h2>
                <p className="body-small text-blue-300 mb-2">
                  Welcome! Please set your new password to continue
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                  {resetData?.email}
                </div>
              </div>

              <form className="space-y-6" onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label text-blue-100">
                      New Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pearl-300" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        className="input-field pl-10 pr-10 bg-violet-400/20 border-violet-300 text-pearl-100 placeholder-pearl-300"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pearl-300 hover:text-lumen-400 transition-colors"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-pearl-100">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pearl-300" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="input-field pl-10 pr-10 bg-violet-400/20 border-violet-300 text-pearl-100 placeholder-pearl-300"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pearl-300 hover:text-lumen-400 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="btn-secondary flex-1"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="btn-primary flex-1"
                  >
                    {passwordChangeLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-space-950 mr-2"></div>
                        Setting...
                      </div>
                    ) : (
                      "Set Password"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
