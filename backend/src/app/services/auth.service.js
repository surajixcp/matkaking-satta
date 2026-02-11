const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Wallet, sequelize } = require('../../db/models');

/**
 * Service to handle Authentication logic
 */
class AuthService {
    /**
     * Register a new user
     * @param {Object} data - { phone, mpin, full_name, device_token }
     */
    async register(data) {
        const transaction = await sequelize.transaction();
        try {
            const { phone, mpin, full_name, device_token } = data;

            // Check if user exists
            const existingUser = await User.findOne({ where: { phone } });
            if (existingUser) {
                throw new Error('Phone number already registered');
            }

            // Create User
            const mpin_hash = await bcrypt.hash(String(mpin).trim(), 10);
            const user = await User.create({
                phone,
                mpin_hash,
                full_name,
                device_token,
                role: 'user',
                status: 'active'
            }, { transaction });

            // Create User Wallet
            await Wallet.create({
                user_id: user.id,
                balance: 0.00,
                bonus: 50.00 // Sign up bonus example
            }, { transaction });

            await transaction.commit();

            const token = user.getSignedJwtToken();
            return { user, token };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} phone
     * @param {string} mpin
     */
    async login(phone, mpin) {
        console.log(`[AUTH SERVICE] Login attempt for ${phone} with MPIN: '${mpin}'`);
        const user = await User.findOne({
            where: { phone },
            include: [{ model: Wallet, as: 'wallet' }]
        });

        if (!user) {
            console.log(`[AUTH SERVICE] User not found: ${phone}`);
            throw new Error('Invalid credentials');
        }

        if (user.status === 'blocked') {
            throw new Error('Your account is blocked. Contact support.');
        }

        // Verify MPIN
        console.log(`[AUTH SERVICE] Verifying MPIN. Stored hash: ${user.mpin_hash}`);
        const isMatch = await bcrypt.compare(mpin, user.mpin_hash);
        console.log(`[AUTH SERVICE] MPIN match result: ${isMatch}`);

        if (!isMatch) {
            throw new Error('Invalid MPIN');
        }

        const token = user.getSignedJwtToken();
        return { user, token };
    }

    /**
     * Verify OTP (Stub - Integrate Firebase Admin later)
     */
    async verifyOtp(phone, otp) {
        // TODO: Implement actual Firebase verify
        if (otp === '123456') return true; // Mock
        return false;
    }

    /**
     * Update user profile picture
     * @param {number} userId
     * @param {string} imageUrl
     */
    async updateProfilePic(userId, imageUrl) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Optional: Delete old image from Cloudinary if needed (requires public_id storage)

        user.profile_pic = imageUrl;
        await user.save();
        return user;
    }

    /**
     * Remove user profile picture
     * @param {number} userId
     */
    async removeProfilePic(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        user.profile_pic = null;
        await user.save();
        return user;
    }

    /**
     * Firebase Login / Registration
     * @param {string} idToken - Firebase ID Token from client
     */
    async firebaseLogin(idToken) {
        // 1. Verify ID Token using Firebase Admin
        // Lazily require firebase-admin to avoid circular deps or init issues
        const admin = require('../../config/firebase');

        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error('[AUTH SERVICE] Firebase Token Error:', error);
            throw new Error('Invalid Firebase ID Token');
        }

        const { uid, phone_number } = decodedToken;

        if (!phone_number) {
            throw new Error('Phone number not found in Firebase Token. Ensure phone auth is used.');
        }

        console.log(`[AUTH SERVICE] Firebase Login for ${phone_number} (UID: ${uid})`);

        // 2. Check if user exists by Firebase UID (Fastest)
        let user = await User.findOne({
            where: { firebase_uid: uid },
            include: [{ model: Wallet, as: 'wallet' }]
        });

        // 3. If not found by UID, check by Phone (Migration or First Login)
        if (!user) {
            user = await User.findOne({
                where: { phone: phone_number },
                include: [{ model: Wallet, as: 'wallet' }]
            });

            if (user) {
                // Link current user to Firebase UID
                user.firebase_uid = uid;
                await user.save();
                console.log(`[AUTH SERVICE] Linked existing user ${phone_number} to Firebase UID ${uid}`);
            }
        }

        // 4. If still not found, Register New User
        if (!user) {
            console.log(`[AUTH SERVICE] Creating new user for ${phone_number}`);
            const transaction = await sequelize.transaction();
            try {
                // Auto-generate random MPIN hash as placeholder (User sets it later)
                const mockMpin = Math.floor(1000 + Math.random() * 9000).toString();
                const mpin_hash = await bcrypt.hash(mockMpin, 10);

                user = await User.create({
                    phone: phone_number,
                    firebase_uid: uid,
                    mpin_hash, // Placeholder
                    role: 'user',
                    status: 'active'
                }, { transaction });

                // Create Wallet
                await Wallet.create({
                    user_id: user.id,
                    balance: 0.00,
                    bonus: 50.00
                }, { transaction });

                await transaction.commit();

                // Re-fetch with wallet for consistency
                user = await User.findByPk(user.id, { include: [{ model: Wallet, as: 'wallet' }] });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        }

        if (user.status === 'blocked') {
            throw new Error('Your account is blocked. Contact support.');
        }

        // 5. Generate JWT
        const token = user.getSignedJwtToken();

        // Return both token and user info
        return { user, token };
    }

    /**
     * Change MPIN
     * @param {number} userId
     * @param {string} oldMpin
     * @param {string} newMpin
     */
    async changeMpin(userId, oldMpin, newMpin) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Verify Old MPIN
        const isMatch = await bcrypt.compare(oldMpin, user.mpin_hash);
        if (!isMatch) {
            throw new Error('Incorrect old MPIN');
        }

        // Hash New MPIN
        const salt = await bcrypt.genSalt(10);
        user.mpin_hash = await bcrypt.hash(newMpin, salt);
        await user.save();

        return { success: true, message: 'MPIN updated successfully' };
    }

    /**
     * Update Bank Details
     */
    async updateBankDetails(userId, bankData) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Update fields
        if (bankData.bank_name !== undefined) user.bank_name = bankData.bank_name;
        if (bankData.account_number !== undefined) user.account_number = bankData.account_number;
        if (bankData.ifsc_code !== undefined) user.ifsc_code = bankData.ifsc_code;
        if (bankData.account_holder_name !== undefined) user.account_holder_name = bankData.account_holder_name;
        if (bankData.upi_id !== undefined) user.upi_id = bankData.upi_id;

        await user.save();
        return user;
    }
}

module.exports = new AuthService();
