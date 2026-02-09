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

        // Send SMS via Twilio if crendentials are present
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        if (accountSid && authToken && twilioPhone && accountSid !== 'your_twilio_account_sid') {
            try {
                const client = require('twilio')(accountSid, authToken);
                await client.messages.create({
                    body: `Your King Matka OTP is: ${otpCode}`,
                    from: twilioPhone,
                    to: `+91${phone}` // Assuming Indian numbers for now, or ensure phone has country code
                });
                console.log(`[Twilio SMS] Sent OTP ${otpCode} to ${phone}`);
                res.send({
                    data: {
                        message: "OTP sent successfully via SMS",
                    }
                });
            } catch (twilioError) {
                console.error("Twilio Error:", twilioError);
                // Fallback to mock/log if Twilio fails (e.g. unverified number in trial)
                console.log(`[MOCK SMS - Fallback] OTP for ${phone} is: ${otpCode}`);
                res.send({
                    data: {
                        // Include error message for debugging
                        message: `Twilio Error: ${twilioError.message}. OTP (Mock): ${otpCode}`,
                        isFallback: true
                    }
                });
            }
        } else {
            // Mock Send SMS - In production replace with actual SMS provider call
            console.log(`[MOCK SMS] OTP for ${phone} is: ${otpCode}`);

            res.send({
                data: {
                    message: "OTP sent successfully (Mock)",
                    // In dev mode/test, maybe return OTP for easier testing if needed, but safer to just log it
                    // otp: otpCode // Uncomment for easier debugging if requested
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
