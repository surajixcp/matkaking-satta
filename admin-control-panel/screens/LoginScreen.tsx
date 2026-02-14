
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';
import { authService } from '../services/api';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const phoneInput = form.querySelector('input[name="phone"]') as HTMLInputElement;
    const pinInput = form.querySelector('input[name="pin"]') as HTMLInputElement;

    const phone = phoneInput.value;
    const pin = pinInput.value;

    // Validate Phone (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    setIsLoading(true);

    try {
      // Use the actual auth service
      await authService.login(phone, pin);
      onLogin();
    } catch (error: any) {
      console.error("Login failed", error);
      alert(error.response?.data?.error || "Login failed. Check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-6 border border-indigo-400/30">
            <span className="text-4xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-400">Please sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  defaultValue="9999999999"
                  maxLength={10}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  placeholder="Enter Admin Phone"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">Admin Security PIN</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="pin"
                  required
                  placeholder="Enter 4-6 digit PIN"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          &copy; 2024 BetPro Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
