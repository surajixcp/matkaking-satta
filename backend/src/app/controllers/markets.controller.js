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
