const resultsService = require('../services/results.service');



exports.getHistory = async (req, res, next) => {
    try {
        // The admin panel should ALWAYS see real-time results, never the 10-minute masked delay intended for the frontend app.
        const history = await resultsService.getHistory(false);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

exports.deleteTodayResults = async (req, res, next) => {
    try {
        const response = await resultsService.deleteTodayResults();
        res.json(response);
    } catch (error) {
        next(error);
    }
};

exports.deleteResult = async (req, res, next) => {
    try {
        const { id } = req.params;
        const response = await resultsService.deleteResult(id);
        res.json(response);
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
