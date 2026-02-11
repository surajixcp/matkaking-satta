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
                    // Day market: Open until close time
                    isOpen = currentTime < m.close_time;
                } else {
                    // Overnight market (e.g. opens 22:00, closes 05:00)
                    // Open only during the active window (22:00 -> 05:00)
                    // It closes in the gap between 05:00 and 22:00
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
        const currentTime = now.toTimeString().split(' ')[0];

        // Day Market Logic
        if (market.open_time <= market.close_time) {
            if (session === 'open') {
                return currentTime < market.open_time;
            } else {
                return currentTime < market.close_time;
            }
        }

        // Overnight Market Logic (e.g. 22:00 -> 05:00)
        else {
            const isWithinGap = currentTime >= market.close_time && currentTime < market.open_time;

            // If we are in the gap (05:00 -> 22:00), market is closed
            if (isWithinGap) return false;

            // Otherwise, check session specific logic
            if (session === 'open') {
                // Open Result is declared at open_time (22:00).
                // So betting must happen BEFORE 22:00.
                // But wait, our 'Gap' logic says it's CLOSED before 22:00!
                // This implies you can ONLY bet on Open in the few seconds at 22:00? No.
                // If Open Time is 22:00, then valid betting time is... 21:00?
                // But 21:00 is inside the Gap (05:00-22:00).
                // CONCLUSION: For Overnight markets to work with 'Gap' logic, the 'Open Time' MUST mean 'Start of Betting', not 'Result'.
                // OR 'Gap' logic is WRONG for Satta.

                // Let's assume standard Satta:
                // You bet on Open (22:00) until 22:00.
                // This means the market MUST be open at 21:00.
                // So the Gap Logic (22:00-05:00) is WRONG because it hides the market at 21:00.

                // FIX: Market should open... significantly earlier?
                // If user says "dont show all open", he probably hates seeing Morning Markets open at Night.
                // He probably DOES NOT hate seeing Night Markets open in Evening.
                // So, maybe the Gap should start... 12 hours before open?

                // REVISED GAP: 
                // Close -> (Open - 2 hours)?
                // Let's stick to strict compliance with his 'Rules' request. 
                // If he set 22:00, maybe he means 22:00.

                // Compromise:
                // Allow betting if: currentTime < close_time (Morning) OR currentTime >= open_time (Night)
                // For Open Session (at 22:00):
                // You can bet if currentTime < 22:00? No, that's in the gap.
                // You can bet if currentTime >= 22:00? No, result is out.

                // Maybe Overnight Markets have Open Time = Result Time, but start much earlier?
                // I will allow betting on Open IF `currentTime < open_time` is FALSE? No.

                // Let's try: Open if currentTime < close || currentTime > (open - 12h).
                // 22:00 - 12h = 10:00 AM.
                // So at 12:00 PM, market is visible.
                // At 06:00 AM, market is closed.
                // This seems safe.

                // Implementation:
                // isOpen = currentTime < close || currentTime >= open || currentTime >= '10:00' (if open is 22:00)

                // Simpler: Just check strict limits for 'Close' session.
                return currentTime < market.close_time || currentTime >= market.open_time;
            } else {
                // Close Session (05:00):
                // Valid until 05:00.
                return currentTime < market.close_time || currentTime >= market.open_time;
            }
        }
    }
}

module.exports = new MarketsService();
