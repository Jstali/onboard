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
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url('/ChatGPT Image Sep 4, 2025, 07_15_39 PM.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-deep-space-black/40"></div>
      
      {/* Logo in top left */}
      {/* <div className="absolute top-8 left-10">
        <img 
          src="/favicon.png" 
          alt="favicon" 
          className="h-24 w-auto"
        />
      </div> */}

      <div className="absolute z-10 w-full max-w-md mx-4">
        <div className="bg-deep-space-black/95 rounded-2xl p-8 shadow-2xl border border-deep-space-black/20 backdrop-blur-sm">
          <div className="text-center mb-8 ">
          <img 
          src="/nxzen-logo.png" 
          alt="nxzen logo" 
          className="h-20 w-auto"
            />
          </div>

          {!showPasswordChange ? (
            // Login Form
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="brand-body-sm text-white mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-gray-100 border border-deep-space-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder-deep-space-black/70"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="brand-body-sm text-white mb-2 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 bg-brand-white/90 border border-brand-yellow/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder-deep-space-black/70 pr-12"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-deep-space-black/70 hover:text-deep-space-black transition-colors"
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
                className="w-full py-3 px-6 bg-lumen-green text-deep-space-black brand-subheading-sm rounded-lg hover:bg-neon-violet hover:text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-deep-space-black mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  "SIGN IN"
                )}
              </button>
            </form>
          ) : (
            // Password Change Form
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-lumen-green rounded-2xl flex items-center justify-center shadow-lg">
                  <FaCheck className="text-2xl text-deep-space-black" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Set New Password</h2>
                <p className="text-white/70 mb-2">
                  Welcome! Please set your new password to continue
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-lumen-green/20 text-lumen-green font-medium text-sm">
                  {resetData?.email}
                </div>
              </div>

              <form className="space-y-6" onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-white mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        className="w-full px-4 py-3 bg-brand-yellow/90 border border-brand-yellow/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder-deep-space-black/70 pr-12"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-deep-space-black/70 hover:text-deep-space-black transition-colors"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-white mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="w-full px-4 py-3 bg-brand-yellow/90 border border-brand-yellow/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-lumen-green focus:border-lumen-green text-deep-space-black placeholder-deep-space-black/70 pr-12"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-deep-space-black/70 hover:text-deep-space-black transition-colors"
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
                    className="flex-1 py-3 px-6 bg-white border border-deep-space-black/20 text-deep-space-black font-semibold rounded-lg hover:bg-iridescent-pearl transition-all duration-200"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="flex-1 py-3 px-6 bg-lumen-green text-deep-space-black font-semibold rounded-lg hover:bg-neon-violet hover:text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordChangeLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-deep-space-black mr-2"></div>
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
