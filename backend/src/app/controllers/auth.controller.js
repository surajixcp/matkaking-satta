const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
    try {
        const { phone, mpin, full_name, device_token } = req.body;

        // Basic validation
        if (!phone || !mpin) {
            return res.status(400).json({ success: false, error: 'Phone and MPIN are required' });
        }

        const result = await authService.register({ phone, mpin, full_name, device_token });

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { phone, mpin } = req.body;

        if (!phone || !mpin) {
            return res.status(400).json({ success: false, error: 'Phone and MPIN are required' });
        }

        const result = await authService.login(phone, mpin);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
};

exports.updateProfilePic = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        const userId = req.user.id;
        const imageUrl = req.file.path; // Cloudinary URL

        const user = await authService.updateProfilePic(userId, imageUrl);

        res.status(200).json({
            success: true,
            data: {
                profile_pic: user.profile_pic
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.removeProfilePic = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await authService.removeProfilePic(userId);

        res.status(200).json({
            success: true,
            message: 'Profile picture removed'
        });
    } catch (error) {
        next(error);
    }
};

exports.firebaseLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, error: 'Firebase ID Token is required' });
        }

        const result = await authService.firebaseLogin(idToken);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.changeMpin = async (req, res, next) => {
    try {
        const { oldMpin, newMpin } = req.body;
        const userId = req.user.id;

        if (!oldMpin || !newMpin) {
            return res.status(400).json({ success: false, error: 'Old and New MPIN are required' });
        }

        if (newMpin.length !== 4 || isNaN(newMpin)) {
            return res.status(400).json({ success: false, error: 'New MPIN must be a 4-digit number' });
        }

        const result = await authService.changeMpin(userId, oldMpin, newMpin);

        res.status(200).json({
            success: true,
            data: { message: result.message }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBankDetails = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bankData = req.body; // { bank_name, account_number, ifsc_code, account_holder_name, upi_id }

        const user = await authService.updateBankDetails(userId, bankData);

        res.status(200).json({
            success: true,
            message: 'Bank details updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};
