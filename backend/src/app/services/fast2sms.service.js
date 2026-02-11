const axios = require('axios');

/**
 * Fast2SMS Service
 * Handles SMS sending via Fast2SMS API
 */
class Fast2SMSService {
    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.baseURL = 'https://www.fast2sms.com/dev/bulkV2';
    }

    /**
     * Send OTP via Fast2SMS
     * @param {string} phone - 10-digit Indian phone number
     * @param {string} otp - 6-digit OTP code
     * @returns {Promise<Object>} Fast2SMS API response
     */
    async sendOTP(phone, otp) {
        if (!this.apiKey || this.apiKey === 'your_fast2sms_api_key_here') {
            console.log(`[MOCK SMS - Fast2SMS not configured] OTP for ${phone}: ${otp}`);
            return {
                success: false,
                message: 'Fast2SMS not configured',
                isMock: true
            };
        }

        try {
            const message = `Your King Matka OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

            const response = await axios.post(
                this.baseURL,
                {
                    route: 'q',
                    message: message,
                    language: 'english',
                    flash: 0,
                    numbers: phone
                },
                {
                    headers: {
                        'authorization': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`[Fast2SMS] OTP sent to ${phone}:`, response.data);

            return {
                success: response.data.return === true,
                message: response.data.message || 'OTP sent successfully',
                data: response.data
            };

        } catch (error) {
            console.error('[Fast2SMS] Error sending OTP:', error.response?.data || error.message);

            // Fallback to mock for development/testing
            console.log(`[MOCK SMS - Fast2SMS Error Fallback] OTP for ${phone}: ${otp}`);

            throw new Error(error.response?.data?.message || 'Failed to send OTP via Fast2SMS');
        }
    }

    /**
     * Check Fast2SMS service health
     * @returns {boolean} Whether Fast2SMS is configured
     */
    isConfigured() {
        return !!(this.apiKey && this.apiKey !== 'your_fast2sms_api_key_here');
    }
}

module.exports = new Fast2SMSService();
