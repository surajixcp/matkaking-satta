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

    /**
     * Process wins for Single Digit and Patti
     */
    /**
     * Re-calculate wins for a specific market and date.
     * Useful if bids were missed or game types were mismatched.
     */
    async reprocessResults(marketId, date) {
        // Use a transaction to ensure atomicity
        const transaction = await sequelize.transaction();
        try {
            const result = await Result.findOne({
                where: { market_id: marketId, date: date },
                transaction
            });

            if (!result) throw new Error('No declared result found for this market and date.');

            console.log(`[Reprocess] Starting for Market ${marketId} Date ${date}`);

            // 1. Process Open Session wins if declared
            if (result.open_declare) {
                const [panna, single] = result.open_declare.split('-');
                console.log(`[Reprocess] Processing OPEN: ${panna}-${single}`);
                await this._processSessionWins(marketId, 'Open', single, panna, transaction);
            }

            // 2. Process Close Session wins if declared
            if (result.close_declare) {
                const [panna, single] = result.close_declare.split('-');
                console.log(`[Reprocess] Processing CLOSE: ${panna}-${single}`);
                await this._processSessionWins(marketId, 'Close', single, panna, transaction);
            }

            // 3. Process Complex Wins (Jodi/Sangam) if BOTH declared
            if (result.open_declare && result.close_declare) {
                const [openPanna, openSingle] = result.open_declare.split('-');
                const [closePanna, closeSingle] = result.close_declare.split('-');
                console.log(`[Reprocess] Processing COMPLEX wins`);
                await this._processComplexWins(marketId, {
                    openPanna, openSingle, closePanna, closeSingle
                }, transaction);
            }

            await transaction.commit();
            return { success: true, message: `Reprocessed results for Market ${marketId}` };
        } catch (error) {
            await transaction.rollback();
            console.error(`[Reprocess] Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process wins for Single Digit and Patti
     */
    async _processSessionWins(marketId, session, single, panna, transaction) {
        // Standardize session to First Letter Capitalized (Open/Close) or lowercase depending on DB. 
        // We will assume DB stores it exactly as passed or as lowercase. To be safe, let's check both or lowercase it.
        // Actually, we should check lowercase for consistency in DB if `bids.session` stores it as 'open' or 'close'
        const normalizedSession = session.toLowerCase();

        // 1. Fetch Game Types with Flexible Matching
        const gameTypes = await GameType.findAll();

        // Helper to find GameType by name (case-insensitive) via keywords or exact match
        const findGT = (keywords) => gameTypes.find(gt => {
            const name = gt.name.trim().toLowerCase();
            return keywords.some(k => name === k.toLowerCase() || name.includes(k.toLowerCase()));
        });

        // Use more robust matching
        // "Single" might be "Single Digit" or just "Single" in DB
        const singleGT = findGT(['single digit', 'single', 'digit']);
        const singlePattiGT = findGT(['single patti', 'single panna', 'single panel', 'sp']);
        const doublePattiGT = findGT(['double patti', 'double panna', 'double panel', 'dp']);
        const triplePattiGT = findGT(['triple patti', 'triple panna', 'triple panel', 'tp']);

        // Log found GameTypes for debugging
        console.log(`\n--- DEBUG SESSION WINS ---`);
        console.log(`[WinProcess Debug] marketId: ${marketId}, session: ${normalizedSession}`);
        console.log(`[WinProcess Debug] Received Panna: '${panna}', Single: '${single}'`);
        console.log(`[WinProcess] GT IDs: Single=${singleGT?.id}, SP=${singlePattiGT?.id}, DP=${doublePattiGT?.id}, TP=${triplePattiGT?.id}`);
        console.log(`[WinProcess] GT IDs: Single=${singleGT?.id}, SP=${singlePattiGT?.id}, DP=${doublePattiGT?.id}, TP=${triplePattiGT?.id}`);

        // VALIDATION: If critical GameTypes are missing, we CANNOT process wins correctly.
        if (!singleGT) {
            console.error("[CRITICAL] 'Single Digit' GameType not found! Win distribution for Single will fail.");
        }
        if (!singlePattiGT) {
            console.error("[CRITICAL] 'Single Patti' GameType not found! Win distribution for Patti will fail.");
        }

        // Log if any critical game type is missing
        if (!singleGT) console.warn("[Warning] 'Single Digit' GameType not found! Check DB GameTypes.");

        // 2. Determine Patti Type
        const pannaDigits = panna.split('').sort();
        let pattiTypeGT = singlePattiGT; // Default
        if (pannaDigits[0] === pannaDigits[1] && pannaDigits[1] === pannaDigits[2]) {
            pattiTypeGT = triplePattiGT;
        } else if (pannaDigits[0] === pannaDigits[1] || pannaDigits[1] === pannaDigits[2]) {
            pattiTypeGT = doublePattiGT;
        }

        // 3. Find Pending Bids for this Session
        // We fetch ALL pending bids for this market/session to mark wins AND losses
        const targetGameTypeIds = [singleGT?.id, singlePattiGT?.id, doublePattiGT?.id, triplePattiGT?.id].filter(id => id);
        const bids = await Bid.findAll({
            where: {
                market_id: marketId,
                session: sequelize.where(sequelize.fn('LOWER', sequelize.col('session')), normalizedSession), // Case-insensitive exact match
                status: 'pending',
                game_type_id: { [Op.in]: targetGameTypeIds }
            },
            transaction
        });

        console.log(`[Wins] Query Params: market_id=${marketId}, session = '${normalizedSession}', status = 'pending', game_type in [${targetGameTypeIds.join(',')}]`);
        console.log(`[Wins] Found ${bids.length} pending bids for ${normalizedSession} session.`);

        const allPending = await Bid.count({ where: { market_id: marketId, status: 'pending' }, transaction });
        console.log(`[Wins] Total pending bids in market regardless of session / type: ${allPending} `);

        // 4. Process Bids
        for (const bid of bids) {
            let isWin = false;
            let rate = 0;
            let winDescription = '';

            // Check Single Digit Win
            if (singleGT && bid.game_type_id === singleGT.id) {
                if (bid.digit === single) {
                    isWin = true;
                    rate = singleGT.rate;
                    winDescription = `Win: Single Digit ${single} `;
                }
            }
            // Check Patti Win
            else if (pattiTypeGT && bid.game_type_id === pattiTypeGT.id) {
                if (bid.digit === panna) {
                    isWin = true;
                    rate = pattiTypeGT.rate;
                    winDescription = `Win: ${pattiTypeGT.name} ${panna} `;
                }
            }

            // Update Bid Status
            if (isWin) {
                const winAmount = bid.amount * rate;
                bid.status = 'won';
                bid.win_amount = winAmount;
                await bid.save({ transaction });

                // Credit Wallet
                const wallet = await Wallet.findOne({ where: { user_id: bid.user_id }, transaction });
                if (wallet) {
                    wallet.balance = parseFloat(wallet.balance) + winAmount;
                    await wallet.save({ transaction });

                    // Log Transaction
                    await WalletTransaction.create({
                        wallet_id: wallet.id,
                        amount: winAmount,
                        type: 'win',
                        description: `${winDescription} (${rate}x)`,
                        reference_id: bid.id.toString()
                    }, { transaction });
                }
            } else {
                // Mark as Lost
                bid.status = 'lost';
                bid.win_amount = 0;
                await bid.save({ transaction });
            }
        }
    }

    async _processComplexWins(marketId, results, transaction) {
        const { openPanna, openSingle, closePanna, closeSingle } = results;

        // 1. Fetch Game Types with Flexible Matching
        const gameTypes = await GameType.findAll();

        const findGT = (keywords) => gameTypes.find(gt => {
            const name = gt.name.trim().toLowerCase();
            return keywords.some(k => name === k.toLowerCase() || name.includes(k.toLowerCase()));
        });

        const jodiGT = findGT(['jodi digit', 'jodi', 'pair']);
        const halfSangamGT = findGT(['half sangam', 'half']);
        const fullSangamGT = findGT(['full sangam', 'sangam', 'full']);

        // 2. Define Winning Combinations
        const winningJodi = `${openSingle}${closeSingle} `;
        const winningFullSangam = `${openPanna} -${closePanna} `;
        const winningHalfSangam1 = `${openPanna} -${closeSingle} `;
        const winningHalfSangam2 = `${openSingle} -${closePanna} `;

        // 3. Find Pending Bids
        const targetComplexIds = [jodiGT?.id, halfSangamGT?.id, fullSangamGT?.id].filter(id => id);

        const complexBids = await Bid.findAll({
            where: {
                market_id: marketId,
                status: 'pending',
                game_type_id: { [Op.in]: targetComplexIds }
            },
            transaction
        });

        // 4. Process Wins
        for (const bid of complexBids) {
            let isWin = false;
            let rate = 0;
            let winDescription = '';

            if (jodiGT && bid.game_type_id === jodiGT.id) {
                if (bid.digit === winningJodi) {
                    isWin = true;
                    rate = jodiGT.rate;
                    winDescription = `Win: Jodi ${bid.digit} `;
                }
            } else if (fullSangamGT && bid.game_type_id === fullSangamGT.id) {
                if (bid.digit === winningFullSangam) {
                    isWin = true;
                    rate = fullSangamGT.rate;
                    winDescription = `Win: Full Sangam ${bid.digit} `;
                }
            } else if (halfSangamGT && bid.game_type_id === halfSangamGT.id) {
                if (bid.digit === winningHalfSangam1 || bid.digit === winningHalfSangam2) {
                    isWin = true;
                    rate = halfSangamGT.rate;
                    winDescription = `Win: Half Sangam ${bid.digit} `;
                }
            }

            if (isWin) {
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
            } else {
                // Mark as lost ONLY if we are sure it's a loss. 
                // Since we filtered by specific Game Types, if it's not a win, it's a loss for these types.
                bid.status = 'lost';
                bid.win_amount = 0;
                await bid.save({ transaction });
            }
        }
    }

    async getHistory(applyDelay = false) {
        let results = await Result.findAll({
            include: [{ model: Market, as: 'market' }],
            order: [['date', 'DESC'], ['updatedAt', 'DESC']],
            limit: 50
        });

        if (applyDelay) {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

            results = results.map(r => {
                const result = r.toJSON(); // Convert to plain object to modify

                if (new Date(result.updatedAt) > tenMinutesAgo) {
                    // Result was updated recently (less than 10 mins ago)

                    if (result.close_declare) {
                        // If close is present, assume the update was for Close
                        // Mask Close, keep Open
                        result.close_declare = null;
                    } else {
                        // If close is not present, the update was likely for Open
                        // Mask Open
                        result.open_declare = null;
                    }
                }
                return result;
            });
        }

        return results;
    }


}

module.exports = new ResultsService();
