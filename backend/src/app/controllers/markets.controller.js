const marketsService = require('../services/markets.service');

exports.getMarkets = async (req, res, next) => {
    try {
        const markets = await marketsService.getMarkets();
        res.json({ success: true, data: markets });
    } catch (error) {
        next(error);
    }
};

exports.getGameTypes = async (req, res, next) => {
    try {
        const gameTypes = await marketsService.getGameTypes();
        res.json({ success: true, data: gameTypes });
    } catch (error) {
        next(error);
    }
};

exports.createMarket = async (req, res, next) => {
    try {
        const market = await marketsService.createMarket(req.body);
        res.status(201).json({ success: true, data: market });
    } catch (error) {
        next(error);
    }
};

exports.updateMarket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const market = await marketsService.updateMarket(id, req.body);
        res.status(200).json({ success: true, data: market });
    } catch (error) {
        next(error);
    }
};

exports.deleteMarket = async (req, res, next) => {
    try {
        const { id } = req.params;
        await marketsService.deleteMarket(id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

exports.checkStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { session } = req.query;
        const market = await marketsService.getMarketById(id); // Need to ensure this exists or use findByPk
        const isOpen = await marketsService.isMarketOpen(id, session || 'open');
        const currentTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });

        res.json({
            success: true,
            data: {
                market,
                currentTime,
                session,
                isOpen
            }
        });
    } catch (error) {
        next(error);
    }
};
