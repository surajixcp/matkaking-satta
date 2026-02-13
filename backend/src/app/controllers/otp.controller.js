const db = require('../../db/models');
const Otp = db.Otp;
const User = db.User;

// Helper to generate numeric OTP
const generateNumericOTP = (length) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

exports.generateOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).send({ message: "Phone number is required" });
        }

        // Generate 6 digit OTP
        const otpCode = generateNumericOTP(6);

        // Set expiry (e.g., 5 minutes from now)
        const expiresAt = new Date(new Date().getTime() + 5 * 60000);

        // Delete any existing OTPs for this phone to avoid clutter
        await Otp.destroy({ where: { phone_number: phone } });

        // Create new OTP record
        await Otp.create({
            phone_number: phone,
            otp_code: otpCode,
            expires_at: expiresAt
        });

        // Send SMS via Fast2SMS
        const fast2sms = require('../services/fast2sms.service');

        try {
            const result = await fast2sms.sendOTP(phone, otpCode);

            if (result.isMock) {
                // Development mode - Fast2SMS not configured
                console.log(`[MOCK SMS] OTP for ${phone} is: ${otpCode}`);
                res.send({
                    data: {
                        message: `OTP sent successfully (Mock). Code: ${otpCode}`,
                        isMock: true,
                        otp: otpCode
                    }
                });
            } else if (result.success) {
                // Fast2SMS sent successfully
                res.send({
                    data: {
                        message: `OTP sent successfully. Code: ${otpCode} (Debug Mode)`,
                        otp: otpCode // Expose for frontend auto-fill if needed
                    }
                });
            } else {
                // Fast2SMS failed but didn't throw error
                console.log(`[Fast2SMS Warning] ${result.message}. OTP (Mock): ${otpCode}`);
                res.send({
                    data: {
                        message: `SMS service issue: ${result.message}. OTP (Mock): ${otpCode}`,
                        isFallback: true
                    }
                });
            }
        } catch (smsError) {
            console.error("Fast2SMS Error:", smsError.message);
            // Return success but log the OTP for development
            console.log(`[MOCK SMS - Fallback] OTP for ${phone} is: ${otpCode}`);
            res.send({
                data: {
                    message: `SMS Error: ${smsError.message}. OTP: ${otpCode}`,
                    isFallback: true,
                    otp: otpCode
                }
            });
        }

    } catch (err) {
        console.error("Error generating OTP:", err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).send({ message: "Phone and OTP are required" });
        }

        // Find the OTP record
        const otpRecord = await Otp.findOne({
            where: {
                phone_number: phone,
                otp_code: otp
            }
        });

        if (!otpRecord) {
            return res.status(400).send({ message: "Invalid OTP" });
        }

        // Check if expired
        if (new Date() > otpRecord.expires_at) {
            return res.status(400).send({ message: "OTP has expired" });
        }

        // OTP is valid. 
        // We should check if user exists to return correct status/token
        let user = await User.findOne({ where: { phone: phone } });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
        }

        // Delete used OTP
        await otpRecord.destroy();

        if (isNewUser) {
            res.send({
                data: {
                    message: "OTP verified successfully",
                    isNewUser: true
                }
            });
        } else {
            // Generate Token for existing user
            const token = user.getSignedJwtToken();
            res.send({
                data: {
                    message: "OTP verified successfully",
                    isNewUser: false,
                    token: token,
                    user: user
                }
            });
        }

    } catch (err) {
        console.error("Error verifying OTP:", err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};
