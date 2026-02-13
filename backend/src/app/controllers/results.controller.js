const resultsService = require('../services/results.service');

exports.declareResult = async (req, res, next) => {
    try {
        const { marketId, session, panna, single } = req.body;

        if (!marketId || !session || !panna || !single) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const result = await resultsService.declareResult({
            marketId,
            session,
            panna,
            single,
            declaredBy: req.user.id // Assuming auth middleware adds user
        });

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const history = await resultsService.getHistory(true);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

exports.revokeResult = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await resultsService.revokeResult(id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

exports.reprocessResults = async (req, res, next) => {
    try {
        const { marketId, date } = req.body;
        if (!marketId || !date) {
            return res.status(400).json({ success: false, error: 'Market ID and Date are required' });
        }

        const result = await resultsService.reprocessResults(marketId, date);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
