const { SystemSetting } = require('../../db/models');

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await SystemSetting.findAll();
        const formatted = {};
        settings.forEach(s => formatted[s.key] = s.value);
        res.json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const updates = req.body; // Expecting { key: value, key2: value2 }
        const keys = Object.keys(updates);

        const promises = keys.map(key => {
            return SystemSetting.upsert({
                key,
                value: updates[key],
                group: 'general' // Default group
            });
        });

        await Promise.all(promises);

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        next(error);
    }
};

// Internal helper to get a specific setting
exports.getSettingValue = async (key) => {
    const setting = await SystemSetting.findByPk(key);
    return setting ? setting.value : null;
};
