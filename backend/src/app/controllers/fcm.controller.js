const { FcmToken } = require('../../db/models');

/**
 * Register or update an FCM token
 */
exports.registerToken = async (req, res) => {
    try {
        const { token, platform, user_id } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Upsert the token (create if new, update if exists)
        // using token as the unique key
        const [fcmToken, created] = await FcmToken.findOrCreate({
            where: { token },
            defaults: {
                user_id: user_id || null,
                platform: platform || 'unknown'
            }
        });

        if (!created) {
            // If token existed, update user_id if provided (e.g. user logged in)
            if (user_id) fcmToken.user_id = user_id;
            if (platform) fcmToken.platform = platform;
            await fcmToken.save();
        }

        return res.status(200).json({
            message: "FCM Token registered successfully",
            data: fcmToken
        });

    } catch (error) {
        console.error("Error registering FCM token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
