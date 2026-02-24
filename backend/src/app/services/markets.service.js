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

        // Use standard new Date() logic because timestamps in DB are already aligned correctly
        // We calculate current total minutes in IST to compare with the open/close times
        const currentIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const dateObj = new Date(currentIST);
        const currentHours = dateObj.getHours();
        const currentMinutes = dateObj.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        return markets.map(market => {
            const m = market.toJSON();
            let isOpen = false;
            let openSessionOpen = false;
            let closeSessionOpen = false;

            if (m.status && m.is_open_for_betting) {
                // Parse DB Time (HH:MM:SS)
                const [openH, openM] = m.open_time.split(':').map(Number);
                const [closeH, closeM] = m.close_time.split(':').map(Number);

                const openTotalMinutes = openH * 60 + openM;
                const closeTotalMinutes = closeH * 60 + closeM;

                // Betting closes 20 minutes prior to result
                const openBetCloseMinutes = openTotalMinutes - 20;
                let closeBetCloseMinutes = closeTotalMinutes - 20;

                if (openTotalMinutes <= closeTotalMinutes) {
                    // Day Market
                    openSessionOpen = currentTotalMinutes < openBetCloseMinutes;
                    closeSessionOpen = currentTotalMinutes < closeBetCloseMinutes;
                    // Market is open overall until the close session result time
                    isOpen = currentTotalMinutes < closeTotalMinutes;
                } else {
                    // Overnight Market
                    // E.g., Open 21:00 (1260), Close 09:00 (540)
                    if (closeBetCloseMinutes < 0) closeBetCloseMinutes += 1440; // Underflow into previous day, though rare for closing time. Handled generally.

                    openSessionOpen = currentTotalMinutes > closeTotalMinutes && currentTotalMinutes < openBetCloseMinutes;

                    // Close session is open if we are before its cutoff.
                    // For overnight, "before close cutoff" could mean after open time up to midnight, OR from midnight up to cutoff.
                    if (currentTotalMinutes > openTotalMinutes || currentTotalMinutes < closeBetCloseMinutes) {
                        closeSessionOpen = true;
                    }

                    // Market is open overall except exactly at the close time duration briefly, or standard overnight logic:
                    isOpen = currentTotalMinutes > closeTotalMinutes || currentTotalMinutes < closeTotalMinutes;
                }
            }

            // Result Masking:
            // Do not reveal results (which might have been fetched early by scrapers)
            // if the respective betting session is STILL actively accepting bets today.
            if (m.results && m.results.length > 0) {
                const todayResult = m.results[0];
                if (openSessionOpen) {
                    todayResult.open_declare = null;
                }
                if (closeSessionOpen) {
                    todayResult.close_declare = null;
                }
            }

            return {
                ...m,
                isOpen,
                openSessionOpen,
                closeSessionOpen
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

        const currentIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const dateObj = new Date(currentIST);
        const currentHours = dateObj.getHours();
        const currentMinutes = dateObj.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // Parse DB Time
        const [openH, openM] = market.open_time.split(':').map(Number);
        const [closeH, closeM] = market.close_time.split(':').map(Number);

        const openTotalMinutes = openH * 60 + openM;
        const closeTotalMinutes = closeH * 60 + closeM;

        const openBetCloseMinutes = openTotalMinutes - 20;
        let closeBetCloseMinutes = closeTotalMinutes - 20;

        if (session === 'open') {
            // Betting on Open Panna/Digit
            // Must be BEFORE Open Bet Close Time
            if (openTotalMinutes <= closeTotalMinutes) {
                // Day Market
                return currentTotalMinutes < openBetCloseMinutes;
            } else {
                // Overnight Market
                return currentTotalMinutes > closeTotalMinutes && currentTotalMinutes < openBetCloseMinutes;
            }
        }

        else {
            // Betting on Close Panna/Digit (session === 'close')
            if (openTotalMinutes <= closeTotalMinutes) {
                // Day Market
                return currentTotalMinutes < closeBetCloseMinutes;
            } else {
                // Overnight Market
                if (closeBetCloseMinutes < 0) closeBetCloseMinutes += 1440;
                return currentTotalMinutes > openTotalMinutes || currentTotalMinutes < closeBetCloseMinutes;
            }
        }
    }
}

module.exports = new MarketsService();
