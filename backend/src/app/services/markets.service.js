const { Market, Result, GameType, sequelize } = require('../../db/models');
const { Op } = require('sequelize');

class MarketsService {
    /**
     * Get all Game Types
     */
    async getGameTypes() {
        return await GameType.findAll({
            order: [['id', 'ASC']]
        });
    }
    /**
     * Create a new market
     */
    async createMarket(data) {
        return await Market.create(data);
    }

    /**
     * List all markets (public)
     * Include today's result if available
     */
    async getMarkets() {
        // Basic implementation: fetch all
        // In production: cache this
        const today = new Date().toISOString().split('T')[0];

        const markets = await Market.findAll({
            order: [['open_time', 'ASC']],
            include: [
                {
                    model: Result,
                    as: 'results',
                    where: { date: today },
                    required: false // Left join
                }
            ]
        });

        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

        return markets.map(market => {
            const m = market.toJSON();
            // Determine if market is currently open for betting
            // 1. Must be active (status = true)
            // 2. Must be open for betting manual toggle (is_open_for_betting = true)
            // 3. Current time must be < close_time (and usually > open_time, but for simplicity just check close)
            // Note: This logic assumes markets open and close on the same day. 
            // For overnight markets, logic needs to be more complex.

            let isOpen = false;
            if (m.status && m.is_open_for_betting) {
                if (m.open_time <= m.close_time) {
                    // Day market
                    isOpen = currentTime >= m.open_time && currentTime < m.close_time;
                } else {
                    // Overnight market (e.g. opens 22:00, closes 05:00)
                    // Open if time > open_time OR time < close_time
                    isOpen = currentTime >= m.open_time || currentTime < m.close_time;
                }
            }

            return {
                ...m,
                isOpen
            };
        });
    }

    /**
     * Update market status (Admin)
     */
    async updateMarket(id, data) {
        const market = await Market.findByPk(id);
        if (!market) throw new Error('Market not found');
        return await market.update(data);
    }

    /**
     * Delete a market
     */
    async deleteMarket(id) {
        const transaction = await sequelize.transaction();
        try {
            const market = await Market.findByPk(id, { transaction });
            if (!market) throw new Error('Market not found');

            // Cascade delete dependencies (Bids & Results)
            // We need to require models here or use the ones imported at top if available
            // Note: Bid/Result are not imported at top of this file, let's fix that or use sequelize.models
            const { Bid, Result } = require('../../db/models');

            // 1. Delete all Bids
            await Bid.destroy({ where: { market_id: id }, transaction });

            // 2. Delete all Results
            await Result.destroy({ where: { market_id: id }, transaction });

            // 3. Delete Market
            await market.destroy({ transaction });

            await transaction.commit();
            return { success: true };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Check if market is open for betting
     */
    async isMarketOpen(marketId, session) { // session = 'open' or 'close'
        const market = await Market.findByPk(marketId);
        if (!market) throw new Error('Market not found');

        if (!market.status) return false; // Market disabled
        if (!market.is_open_for_betting) return false; // Betting disabled manually

        const now = new Date();
        // Convert current time to HH:MM:SS
        const currentTime = now.toTimeString().split(' ')[0];

        // Simple time comparison strings works for 24h format
        if (session === 'open') {
            return currentTime < market.open_time;
        } else if (session === 'close') {
            return currentTime < market.close_time;
        }

        return false;
    }
}

module.exports = new MarketsService();
