import React, { useState, useEffect } from 'react';
import { referralService } from '../services/api';
import { ReferralSetting } from '../types';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const ReferralScreen: React.FC = () => {
    const [settings, setSettings] = useState<ReferralSetting | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await referralService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching referral settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);
        try {
            await referralService.updateSettings(settings);
            setMessage({ type: 'success', text: 'Settings updated successfully' });
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Referral System Settings</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <div className="space-y-6">

                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-lg font-medium text-gray-900">Enable Referral System</label>
                            <p className="text-sm text-gray-500">Allow users to invite friends and earn bonuses</p>
                        </div>
                        <button
                            onClick={() => setSettings(prev => prev ? { ...prev, is_enabled: !prev.is_enabled } : null)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings?.is_enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${settings?.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Bonus Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus Amount (₹)</label>
                        <input
                            type="number"
                            value={settings?.bonus_amount || ''}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, bonus_amount: e.target.value } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="50"
                        />
                        <p className="mt-1 text-sm text-gray-500">Amount credited to the referrer's wallet.</p>
                    </div>

                    {/* Min Deposit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Deposit Required (₹)</label>
                        <input
                            type="number"
                            value={settings?.min_deposit_amount || ''}
                            onChange={(e) => setSettings(prev => prev ? { ...prev, min_deposit_amount: e.target.value } : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="500"
                        />
                        <p className="mt-1 text-sm text-gray-500">Minimum amount the referred user must deposit to trigger the bonus.</p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            Save Settings
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReferralScreen;
