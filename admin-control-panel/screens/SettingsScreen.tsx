
import React, { useState } from 'react';
import {
  Smartphone, Shield, Globe, Image as ImageIcon,
  Save, AlertTriangle, Check, Headphones,
  Settings as SettingsIcon, Link2, Palette, X
} from 'lucide-react';

import { settingsService } from '../services/api';

const SettingsScreen: React.FC = () => {
  // App Version State
  const [version, setVersion] = useState('v2.4.1');
  const [forceUpdate, setForceUpdate] = useState(true);

  // Branding State
  const [appName, setAppName] = useState('BetPro India');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Global Config State
  const [timezone, setTimezone] = useState('(GMT+05:30) India');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [currency, setCurrency] = useState('₹');

  // Payment Config
  const [upiId, setUpiId] = useState('');

  // Support State
  const [whatsapp, setWhatsapp] = useState('+91 90000 12345');
  const [telegram, setTelegram] = useState('@betpro_official');
  const [email, setEmail] = useState('support@kingmatka.com');
  const [phone, setPhone] = useState('+91 90000 12345');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Settings
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await settingsService.getAll();
      if (response && response.data) {
        const s = response.data.data;
        // Load all settings from backend
        if (s.app_version) setVersion(s.app_version);
        if (s.force_update !== undefined) setForceUpdate(s.force_update === 'true');
        if (s.app_name) setAppName(s.app_name);
        if (s.primary_color) setPrimaryColor(s.primary_color);
        if (s.logo_url) setLogoPreview(s.logo_url);
        if (s.timezone) setTimezone(s.timezone);
        if (s.maintenance_mode !== undefined) setMaintenanceMode(s.maintenance_mode === 'true');
        if (s.currency) setCurrency(s.currency);
        if (s.upi_id) setUpiId(s.upi_id);
        if (s.whatsapp) setWhatsapp(s.whatsapp);
        if (s.telegram) setTelegram(s.telegram);
        if (s.email) setEmail(s.email);
        if (s.phone) setPhone(s.phone);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate UPI ID
    if (upiId && !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      newErrors.upiId = 'Invalid UPI ID format (e.g., merchant@upi)';
    }

    // Validate WhatsApp
    if (whatsapp && !/^\+\d{1,3}\s?\d{5,15}$/.test(whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = 'Invalid phone format (e.g., +91 90000 12345)';
    }

    // Validate Telegram
    if (telegram && !/^@[\w]{5,32}$/.test(telegram)) {
      newErrors.telegram = 'Invalid Telegram username (e.g., @username)';
    }

    // Validate Email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format (e.g., support@example.com)';
    }

    // Validate Phone
    if (phone && !/^\+\d{1,3}\s?\d{5,15}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone format (e.g., +91 90000 12345)';
    }

    // Validate Color
    if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      newErrors.primaryColor = 'Invalid hex color (e.g., #4f46e5)';
    }

    // Validate App Name
    if (!appName || appName.trim().length < 2) {
      newErrors.appName = 'App name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Validate first
    if (!validateSettings()) {
      setSaveStatus('error');
      setErrorMessage('Please fix validation errors');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await settingsService.update({
        app_version: version,
        force_update: String(forceUpdate),
        app_name: appName,
        primary_color: primaryColor,
        logo_url: logoPreview || '',
        timezone: timezone,
        maintenance_mode: String(maintenanceMode),
        currency: currency,
        upi_id: upiId,
        whatsapp: whatsapp,
        telegram: telegram,
        email: email,
        phone: phone,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to save settings', error);
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save settings');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaintenanceModeToggle = () => {
    if (!maintenanceMode) {
      // Confirm before enabling
      if (window.confirm('⚠️ This will lock the app for all users. Are you sure?')) {
        setMaintenanceMode(true);
      }
    } else {
      setMaintenanceMode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Settings</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Global app behavior and branding</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${saveStatus === 'success' ? 'bg-emerald-600' : saveStatus === 'error' ? 'bg-red-600' : 'bg-indigo-600'
            } text-white w-full md:w-auto px-6 py-3 sm:px-10 sm:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-70`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : saveStatus === 'success' ? (
            <Check size={20} />
          ) : saveStatus === 'error' ? (
            <X size={20} />
          ) : (
            <Save size={20} />
          )}
          <span className="text-sm sm:text-base">
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
          </span>
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={20} />
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* App Version Config */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Smartphone size={22} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">App Lifecycle</h4>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Live App Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Displayed to users in About section.</p>
            </div>

            <div className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-colors ${forceUpdate ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <p className={`text-xs sm:text-sm font-bold ${forceUpdate ? 'text-rose-700' : 'text-slate-800'}`}>Force Update</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Required to access app</p>
              </div>
              <button
                onClick={() => setForceUpdate(!forceUpdate)}
                className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full relative transition-all p-1 flex items-center ${forceUpdate ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'}`}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Branding & Logo */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Palette size={22} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">Branding</h4>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="App Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  <span className="text-[10px] font-bold uppercase">Change</span>
                </label>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Display Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className={`w-full bg-slate-50 border ${errors.appName ? 'border-red-300' : 'border-slate-200'} rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none`}
                />
                {errors.appName && <p className="text-[10px] text-red-500 mt-1">{errors.appName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Theme Color</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-slate-200 shadow-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}
                ></div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={`w-full bg-slate-50 border ${errors.primaryColor ? 'border-red-300' : 'border-slate-200'} rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-800 outline-none`}
                  />
                  {errors.primaryColor && <p className="text-[10px] text-red-500 mt-1">{errors.primaryColor}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Contact */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Headphones size={22} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">Support</h4>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">WhatsApp Help</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <Link2 size={16} />
                </div>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 00000 00000"
                  className={`w-full bg-slate-50 border ${errors.whatsapp ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none`}
                />
              </div>
              {errors.whatsapp && <p className="text-[10px] text-red-500 mt-1">{errors.whatsapp}</p>}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Telegram User</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">
                  <Link2 size={16} />
                </div>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className={`w-full bg-slate-50 border ${errors.telegram ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none`}
                />
              </div>
              {errors.telegram && <p className="text-[10px] text-red-500 mt-1">{errors.telegram}</p>}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Support</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
                  <Link2 size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@example.com"
                  className={`w-full bg-slate-50 border ${errors.email ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none`}
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Call Us</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Link2 size={16} />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-300' : 'border-slate-200'} rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none`}
                />
              </div>
              {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Globe size={22} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">Configuration</h4>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none appearance-none"
                >
                  <option>(GMT+05:30) India</option>
                  <option>(GMT+00:00) UTC</option>
                </select>
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${maintenanceMode ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3 sm:gap-4 items-center overflow-hidden">
                <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${maintenanceMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className={`text-xs sm:text-sm font-bold truncate ${maintenanceMode ? 'text-amber-700' : 'text-slate-800'}`}>Maintenance Mode</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">{maintenanceMode ? 'App Locked' : 'Live Access'}</p>
                </div>
              </div>
              <button
                onClick={handleMaintenanceModeToggle}
                className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full relative transition-all p-1 flex items-center shrink-0 ${maintenanceMode ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        </div>
        {/* Payment Settings */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 sm:space-y-8 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <SettingsIcon size={22} />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">Payment Configuration</h4>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Admin UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@upi"
                className={`w-full bg-slate-50 border ${errors.upiId ? 'border-red-300' : 'border-slate-200'} rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
              />
              {errors.upiId ? (
                <p className="text-[10px] text-red-500 mt-2 font-medium">{errors.upiId}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-2 font-medium">This ID will be used for QR code generation in user app.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
