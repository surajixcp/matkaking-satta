const { Notice } = require('../../db/models');

class NoticesController {
    // Get all notices (Public: active only, Admin: all)
    async getNotices(req, res, next) {
        try {
            const isAdmin = req.user && req.user.role === 'admin';
            const where = isAdmin ? {} : { active: true };

            const notices = await Notice.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });

            res.json({ success: true, data: notices });
        } catch (error) {
            next(error);
        }
    }

    // Create notice (Admin only)
    async createNotice(req, res, next) {
        try {
            const { title, message, active, priority } = req.body;

            const notice = await Notice.create({
                title,
                message,
                active: active !== undefined ? active : true,
                priority: priority || 0
            });

            res.status(201).json({ success: true, data: notice });
        } catch (error) {
            next(error);
        }
    }

    // Update notice (Admin only)
    async updateNotice(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const notice = await Notice.findByPk(id);
            if (!notice) {
                return res.status(404).json({ success: false, message: 'Notice not found' });
            }

            await notice.update(updates);
            res.json({ success: true, data: notice, message: 'Notice updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Delete notice (Admin only)
    async deleteNotice(req, res, next) {
        try {
            const { id } = req.params;
            const notice = await Notice.findByPk(id);

            if (!notice) {
                return res.status(404).json({ success: false, message: 'Notice not found' });
            }

            await notice.destroy();
            res.json({ success: true, message: 'Notice deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NoticesController();
