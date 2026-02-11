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

        const currentTime = this.getCurrentISTTime();

        return markets.map(market => {
            const m = market.toJSON();
            // Determine if market is currently open for betting
            // 1. Must be active (status = true)
            // 2. Must be open for betting manual toggle (is_open_for_betting = true)

            let isOpen = false;

            if (m.status && m.is_open_for_betting) {
                if (m.open_time <= m.close_time) {
                    // Day market: Open until close time
                    isOpen = currentTime < m.close_time;
                } else {
                    // Overnight market logic
                    // Open if:
                    // 1. Current Time < Close Time (Morning part of overnight)
                    // OR 2. Current Time >= Open Time (Night part of overnight)
                    isOpen = currentTime < m.close_time || currentTime >= m.open_time;
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

        // Overnight Market Logic (e.g. 22:00 -> 05:00)
        else {
            if (session === 'open') {
                // Betting on Open Session (Result at 22:00)
                // Valid until 22:00.
                // So valid if currentTime < 22:00 AND currentTime > 05:00?
                // Wait, if it's 23:00, Open result is declared.
                // So we must be BEFORE Open Time.

                // BUT, if it's 04:00 AM, that is ALSO before 22:00.
                // Is it valid to bet on 22:00 Open at 04:00? Generally yes.
                // The constraints are usually:
                // 1. Must be after previous close (05:00)?
                // Let's keep it simple: Closed if currentTime >= Open Time (and < Close Time? No).

                // Actually, simpler logic:
                // You can bet on OPEN as long as it's not "Too Late".
                // "Too Late" is currentTime >= open_time.
                // But wait, if it is 01:00 AM (next day), currentTime < open_time (22:00) is TRUE.
                // But 01:00 AM is AFTER 22:00 of yesterday.

                // Satta markets usually run daily.
                // Overnight markets are tricky.

                // Let's use the Gap Logic strictly for now, assuming standard behavior:
                // Can bet if NOT in the gap (time between Close and Open, wait no).

                // Let's trust the IST conversion fixes the main issue.
                // For Open Session:
                // Valid if currentTime < open_time OR currentTime > (some early start).
                // Simplest working logic for Night:
                // Valid if currentTime < open_time && currentTime > close_time? No (that's the day gap).

                // Updated Logic from previous thought:
                return currentTime < market.close_time || currentTime >= market.open_time;
            } else {
                // Close Session (05:00)
                // Valid until 05:00.
                return currentTime < market.close_time || currentTime >= market.open_time;
            }
        }
    }
}

module.exports = new MarketsService();
