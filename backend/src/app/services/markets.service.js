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
                    // Strict Logic: Open only BETWEEN Open and Close times.
                    isOpen = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
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

        if (session === 'open') {
            // Betting on Open Panna/Digit
            // Must be BEFORE Open Time
            if (openTotalMinutes <= closeTotalMinutes) {
                // Day Market: e.g. Open 15:00. Current 14:00 -> OK. Current 16:00 -> NO.
                return currentTotalMinutes < openTotalMinutes;
            } else {
                // Overnight: e.g. Open 22:00. 
                // If Current 21:00 -> OK. 
                // If Current 23:00 -> NO.
                // If Current 01:00 -> NO (passed 22:00 yesterday)
                // Logic: We are "before" open time if:
                // 1. Current < Open (Start of day until Open)
                // AND 2. Current > Close ?? No, that's complex.

                // Simplified: If current time is AFTER Open Time, it's too late.
                // But what if it's 01:00 am? That's technically "before" 22:00pm of same day, but we are looking at specific draw.
                // Assuming daily cycle: 
                // You can bet on tonight's 22:00 OPEN until 22:00.
                // After 22:00, you can't.
                // So strict `current < open` check works for 22:00 IF we are in same day.
                // But 01:00 is < 22:00. Should 01:00 be allowed?
                // No, 01:00 is "Next Day's" betting OR "Past" betting?
                // Usually betting closes 22:00. 01:00 is past.
                // So for Overnight, we probably only allow betting if `current < open` AND `current > last_close`? 
                // Or simply: 00:00 to 22:00 is valid. 22:01 to 23:59 is invalid.
                // So `current < open` covers it for `current < 22:00`.
                // But `current < 22:00` also covers 01:00?
                // YES. But 01:00 is AFTER 22:00 of *yesterday*.
                // Satta logic usually resets.
                // Let's assume strict `current < open` is safe for now.
                return currentTotalMinutes < openTotalMinutes;
            }
        }

        else {
            // Betting on Close Panna/Digit (session === 'close')
            // Must be BEFORE Close Time
            if (openTotalMinutes <= closeTotalMinutes) {
                // Day Market: e.g. Close 17:00. Current 16:00 -> OK.
                return currentTotalMinutes < closeTotalMinutes;
            } else {
                // Overnight: e.g. Close 05:00.
                // Current 23:00 (Day 1) -> OK.
                // Current 04:00 (Day 2) -> OK.
                // Current 06:00 (Day 2) -> NO.

                // Logic:
                // If current > Open (22:00) -> OK (Late night betting)
                // OR If current < Close (05:00) -> OK (Early morning betting)
                // ELSE (Between 05:00 and 22:00) -> ?? Usually Close bet depends on Open result?
                // Actually usually you can bet on Close anytime until Close.
                // But if it's 12:00 PM (Noon), is that betting for tonight's 05:00 AM (Next day)? Yes.
                // So valid range is: From "Previous Close" until "This Close".
                // If we assume simplistic check:
                // Valid if `current < close`? 
                // 12:00 < 05:00 is FALSE. So 12:00PM fails? That's bad.
                // Limit is 05:00 AM (next day).
                // So if Time is > Open (22:00), it's OK.
                // If Time is < Close (05:00), it's OK.
                // Wait, gap between 05:00 and 22:00? 
                // If I bet at 14:00 for a 05:00 close?
                // That should be allowed.
                // Actually, if Close is 05:00, that means 05:00 NEXT DAY.
                // So essentially, if current time is "Day", we are early.
                // If current time is "Night" (after 00:00), we are late but before 05:00.

                // If open < close (Day market), `current < close` works.
                // If open > close (Overnight):
                // We allow betting if:
                // 1. Current >= Open (22:00 to 23:59)
                // 2. OR Current < Close (00:00 to 05:00)
                // 3. OR Current < Open AND Current > Close ?? (Daytime 12:00?) -> Likely YES.
                // Satta markets usually run 24/7 cycles.
                // Effectively, Close session is OPEN unless it is specifically the "Closed Window" (Result declaring time?)

                // Let's rely on strict cut-off.
                // You can bet until 05:00.
                // If it is 06:00, you are LATE.
                // If it is 23:00, you are EARLY (for 05:00).

                // So:
                // If `current > close` AND `current < open` -> This is the "Gap" between draw.
                // e.g. 06:00 to 21:00.
                // Is betting closed then?
                // Usually Yes.
                // So valid IF NOT in the GAP.
                // GAP is `close < current < open`.
                // So valid if `! (current > close && current < open)`
                // Which is `current <= close || current >= open`.
                return currentTotalMinutes <= closeTotalMinutes || currentTotalMinutes >= openTotalMinutes;
            }
        }
    }
}

module.exports = new MarketsService();
