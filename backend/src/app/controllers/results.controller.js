const resultsService = require('../services/results.service');



exports.getHistory = async (req, res, next) => {
    try {
        const history = await resultsService.getHistory(true);
        res.json({ success: true, data: history });
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
