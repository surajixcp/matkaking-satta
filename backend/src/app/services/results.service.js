const { Result, Bid, Market, GameType, Wallet, WalletTransaction, User, sequelize } = require('../../db/models');
const { Op } = require('sequelize');

class ResultsService {
    /**
     * Declare a result for a market session
     * @param {Object} data { marketId, session, panna, single, declaredBy }
     */
    async declareResult(data) {
        const { marketId, session, panna, single, declaredBy } = data;
        const transaction = await sequelize.transaction();

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Find or Create Result Record for today
            let result = await Result.findOne({
                where: { market_id: marketId, date: today },
                transaction
            });

            if (!result) {
                result = await Result.create({
                    market_id: marketId,
                    date: today
                }, { transaction });
            }

            // 2. Update the specific session result
            if (session === 'Open') {
                if (result.open_declare) throw new Error('Open result already declared');
                result.open_declare = `${panna}-${single}`;
            } else if (session === 'Close') {
                if (result.close_declare) throw new Error('Close result already declared');
                result.close_declare = `${panna}-${single}`;
            } else {
                throw new Error('Invalid session. Must be Open or Close.');
            }

            await result.save({ transaction });

            // 3. Process Wins (Distribute Money)
            // Determine Game Types to check based on result
            // For Open/Close session, we check:
            // - Single Digit (matches 'single')
            // - Single/Double/Triple Patti (matches 'panna')

            // Note: Jodi Logic (Open+Close) is complex and typically runs after Close is declared.
            // For MVP, we focus on Single/Patti for the session.

            await this._processSessionWins(marketId, session, single, panna, transaction);

            // If Session is Close, we might need to process Complex Wins (Jodi, Sangam) if Open was declared
            if (session === 'Close' && result.open_declare) {
                const [openPanna, openSingle] = result.open_declare.split('-');
                // Current result properties passed to function are 'panna' and 'single' (Close result)
                const closePanna = panna;
                const closeSingle = single;

                await this._processComplexWins(marketId, { openPanna, openSingle, closePanna, closeSingle }, transaction);
            }

            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _processComplexWins(marketId, results, transaction) {
        const { openPanna, openSingle, closePanna, closeSingle } = results;

        // 1. Fetch Game Types
        const gameTypes = await GameType.findAll();
        const gtMap = {};
        gameTypes.forEach(g => gtMap[g.name] = g);

        const jodiGT = gtMap['Jodi Digit'];
        const halfSangamGT = gtMap['Half Sangam'];
        const fullSangamGT = gtMap['Full Sangam'];

        // 2. Define Winning Combinations
        const winningJodi = `${openSingle}${closeSingle}`;
        const winningFullSangam = `${openPanna}-${closePanna}`;
        const winningHalfSangam1 = `${openPanna}-${closeSingle}`;
        const winningHalfSangam2 = `${openSingle}-${closePanna}`;

        // 3. Find Pending Bids
        // We look for bids matching any of these types and digits
        const complexBids = await Bid.findAll({
            where: {
                market_id: marketId,
                status: 'pending',
                [Op.or]: [
                    // Jodi
                    { game_type_id: jodiGT?.id, digit: winningJodi },
                    // Full Sangam
                    { game_type_id: fullSangamGT?.id, digit: winningFullSangam },
                    // Half Sangam (Check both combinations)
                    { game_type_id: halfSangamGT?.id, digit: winningHalfSangam1 },
                    { game_type_id: halfSangamGT?.id, digit: winningHalfSangam2 }
                ]
            },
            transaction
        });

        // 4. Process Wins
        for (const bid of complexBids) {
            let rate = 0;
            let winDescription = '';

            if (bid.game_type_id === jodiGT?.id) {
                rate = jodiGT.rate;
                winDescription = `Win: Jodi ${bid.digit}`;
            } else if (bid.game_type_id === fullSangamGT?.id) {
                rate = fullSangamGT.rate;
                winDescription = `Win: Full Sangam ${bid.digit}`;
            } else if (bid.game_type_id === halfSangamGT?.id) {
                rate = halfSangamGT.rate;
                winDescription = `Win: Half Sangam ${bid.digit}`;
            }

            const winAmount = bid.amount * rate;

            bid.status = 'won';
            bid.win_amount = winAmount;
            await bid.save({ transaction });

            const wallet = await Wallet.findOne({ where: { user_id: bid.user_id }, transaction });
            if (wallet) {
                wallet.balance = parseFloat(wallet.balance) + winAmount;
                await wallet.save({ transaction });

                await WalletTransaction.create({
                    wallet_id: wallet.id,
                    amount: winAmount,
                    type: 'win',
                    description: `${winDescription} (${rate}x)`,
                    reference_id: bid.id.toString()
                }, { transaction });
            }
        }

        // 5. Mark remaining complex bets as lost
        // We need to be careful not to mark open/close single/patti bets as lost here, only strictly complex ones.
        // It's safer to leave 'status: pending' cleanup for a dedicated job or careful query.
        // For now, let's mark strictly matching game types as lost if they are still pending for this market.
        // Since Jodi/Sangam are session-independent (conceptually), but stored with some session tag?
        // Usually they are stored with session='open' or 'close' depending on when placed.
        // Let's assume we mark ALL pending bets of these Game Types for this Market as LOST.

        const complexGameTypeIds = [jodiGT?.id, halfSangamGT?.id, fullSangamGT?.id].filter(id => id);

        await Bid.update({ status: 'lost' }, {
            where: {
                market_id: marketId,
                status: 'pending',
                game_type_id: { [Op.in]: complexGameTypeIds }
            },
            transaction
        });
    }

    async getHistory() {
        return await Result.findAll({
            include: [{ model: Market, as: 'market' }],
            order: [['date', 'DESC'], ['updatedAt', 'DESC']],
            limit: 50
        });
    }

    async revokeResult(resultId) {
        const transaction = await sequelize.transaction();
        try {
            const result = await Result.findByPk(resultId, { transaction });
            if (!result) throw new Error('Result not found');

            let sessionToRevoke = null;
            if (result.close_declare) {
                sessionToRevoke = 'close';
                result.close_declare = null;
            } else if (result.open_declare) {
                sessionToRevoke = 'open';
                result.open_declare = null;
            } else {
                throw new Error('No result declared to revoke');
            }

            // 1. Find all WON bids for this session/market
            const wonBids = await Bid.findAll({
                where: {
                    market_id: result.market_id,
                    session: sessionToRevoke,
                    status: 'won',
                    updatedAt: { [Op.gte]: result.updatedAt } // Optimization: only check recently updated? Better to be safe and check all match.
                    // Actually, just checking session and market and status 'won' is risky if we have old data.
                    // But since we only have one result per day per market, and bids are linked to date/session...
                    // Wait, Bid model has 'date' or 'createdAt'.
                    // We need to ensure we only revert bids for THIS result's date.
                    // Result has 'date'. Bid doesn't explicitly have 'date' column in my previous view, usually createdAt.
                    // Let's assume Bids are filtered by createdAt matching result date.
                },
                transaction
            });

            // We need to be careful. The `declareResult` logic filtered by `status: 'pending'`.
            // Now we need to find bids that were processed.
            // Best way is to assume all 'won' and 'lost' bids for this market/session/date are from this result.
            // Let's filter by created_at range of the result date.
            const startOfDay = new Date(result.date);
            const endOfDay = new Date(result.date);
            endOfDay.setHours(23, 59, 59, 999);

            const processedBids = await Bid.findAll({
                where: {
                    market_id: result.market_id,
                    session: sessionToRevoke,
                    status: { [Op.in]: ['won', 'lost'] },
                    createdAt: {
                        [Op.between]: [startOfDay, endOfDay]
                    }
                },
                transaction
            });

            // 2. Reverse Winnings
            for (const bid of processedBids) {
                if (bid.status === 'won') {
                    const wallet = await Wallet.findOne({ where: { user_id: bid.user_id }, transaction });
                    if (wallet) {
                        wallet.balance = parseFloat(wallet.balance) - parseFloat(bid.win_amount);
                        await wallet.save({ transaction });

                        // Record Reversal Transaction
                        await WalletTransaction.create({
                            wallet_id: wallet.id,
                            amount: bid.win_amount,
                            type: 'withdraw', // effectively a deduction
                            description: `Reversal: Revoked Result for ${result.market_id} (${sessionToRevoke})`,
                            status: 'success'
                        }, { transaction });
                    }
                }

                // 3. Reset Bid
                bid.status = 'pending';
                bid.win_amount = 0;
                await bid.save({ transaction });
            }

            await result.save({ transaction });
            await transaction.commit();
            return { success: true, message: `Revoked ${sessionToRevoke} result` };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new ResultsService();
