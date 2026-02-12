const { Market, Result, GameType, sequelize } = require('../../db/models');
const { Op } = require('sequelize');

class MarketsService {
    /**
     * Seed game types if empty
     */
    async seedGameTypes() {
        const count = await GameType.count();
        if (count === 0) {
            const gameTypes = [
                { name: 'Single Digit', key: 'single_digit', rate: 9.5 },
                { name: 'Jodi Digit', key: 'jodi_digit', rate: 95.0 },
                { name: 'Single Patti', key: 'single_patti', rate: 150.0 },
                { name: 'Double Patti', key: 'double_patti', rate: 300.0 },
                { name: 'Triple Patti', key: 'triple_patti', rate: 700.0 },
                { name: 'Half Sangam', key: 'half_sangam', rate: 1000.0 },
                { name: 'Full Sangam', key: 'full_sangam', rate: 10000.0 }
            ];
            await GameType.bulkCreate(gameTypes);
            return { seeded: true, count: gameTypes.length };
        }
        return { seeded: false, count };
    }

    /**
     * Get all Game Types
     */
    async getGameTypes() {
        // Auto-seed if empty (fallback)
        const count = await GameType.count();
        if (count === 0) {
            await this.seedGameTypes();
        }

        return await GameType.findAll({
            order: [['id', 'ASC']]
        });
    }
    /**
     * Get market by ID
     */
    async getMarketById(id) {
        return await Market.findByPk(id);
    }

    /**
     * Create a new market
     */
    async createMarket(data) {
        return await Market.create(data);
    }

    /**
     * Get current IST time string (HH:MM:SS)
     */
    getCurrentISTTime() {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: false
        });
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

        const currentIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const dateObj = new Date(currentIST);
        const currentHours = dateObj.getHours();
        const currentMinutes = dateObj.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        return markets.map(market => {
            const m = market.toJSON();
            let isOpen = false;

            if (m.status && m.is_open_for_betting) {
                // Parse DB Time (HH:MM:SS)
                const [openH, openM] = m.open_time.split(':').map(Number);
                const [closeH, closeM] = m.close_time.split(':').map(Number);

                const openTotalMinutes = openH * 60 + openM;
                const closeTotalMinutes = closeH * 60 + closeM;

                if (openTotalMinutes <= closeTotalMinutes) {
                    // Day Market (e.g. 10:00 to 22:00)
                    // Currently logic: Open until close.
                    // If we want allow betting before open, then < closeTime is correct.
                    // If strict: >= open && <= close.
                    // Sticking to "Betting Open until Close" logic for now.
                    isOpen = currentTotalMinutes < closeTotalMinutes;
                } else {
                    // Overnight Market (e.g. 22:00 to 02:00)
                    // Open if: Time >= 22:00 OR Time < 02:00
                    isOpen = currentTotalMinutes >= openTotalMinutes || currentTotalMinutes < closeTotalMinutes;
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

        const currentTime = this.getCurrentISTTime();

        // Day Market Logic
        if (market.open_time <= market.close_time) {
            if (session === 'open') {
                return currentTime < market.open_time;
            } else {
                return currentTime < market.close_time;
            }
        }

        // Overnight Market Logic (e.g. 21:00 -> 05:00)
        else {
            if (session === 'open') {
                // Open Session Betting:
                // Valid if currentTime is NOT in the closed window (between Close and Open).
                // Example: Close 05:00, Open 21:00.
                // Valid window: 05:00 -> 21:00.
                // So currentTime > close_time && currentTime < open_time.
                return currentTime > market.close_time && currentTime < market.open_time;
            } else {
                // Close Session Betting:
                // Valid anytime until close_time (next day).
                // Effectively always open because even if we are past 05:00, we are just betting for the next day?
                // But let's stick to the same logic: Valid if NOT "too late".
                // "Too late" is > close_time && < "start of next cycle"?
                // Let's assume valid always for now, as Satta close betting is usually open 24/7 until declare.
                return true;
            }
        }
    }
}

module.exports = new MarketsService();
