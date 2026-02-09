const depositService = require('../services/deposit.service');

exports.createDeposit = async (req, res, next) => {
    try {
        const { amount, utr, screenshotUrl } = req.body;
        if (!amount || !utr) {
            return res.status(400).json({ error: 'Amount and UTR are required' });
        }

        const deposit = await depositService.createDeposit(req.user.id, { amount, utr, screenshotUrl });
        res.status(201).json({ success: true, data: deposit, message: 'Deposit request submitted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getAllDeposits = async (req, res, next) => {
    try {
        const { status, userId, limit, page } = req.query;
        const offset = (page - 1) * limit || 0;

        const filters = { status, userId };
        const result = await depositService.getAllDeposits(filters, limit, offset);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.approveDeposit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await depositService.approveDeposit(id, req.user.id);
        res.json({ success: true, data: result, message: 'Deposit approved and wallet credited' });
    } catch (error) {
        next(error);
    }
};

exports.rejectDeposit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const result = await depositService.rejectDeposit(id, req.user.id, reason);
        res.json({ success: true, data: result, message: 'Deposit rejected' });
    } catch (error) {
        next(error);
    }
};
