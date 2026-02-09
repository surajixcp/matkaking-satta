const bidService = require('../services/bid.service');

exports.placeBid = async (req, res, next) => {
    try {
        const { marketId, gameTypeId, session, bids } = req.body;

        // Check if it's a bulk bid (array)
        if (bids && Array.isArray(bids)) {
            if (!marketId || !gameTypeId || !session || bids.length === 0) {
                return res.status(400).json({ error: 'Missing required fields for bulk bet' });
            }

            const result = await bidService.placeBids({
                userId: req.user.id,
                marketId,
                gameTypeId,
                session,
                bids
            });

            return res.status(201).json({
                success: true,
                data: result.bids,
                newBalance: result.newBalance,
                message: 'Bids placed successfully'
            });
        }

        // Single Check (Start existing logic)
        const { digit, amount } = req.body;

        // Basic Payload Validation
        if (!marketId || !gameTypeId || !session || !digit || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const bid = await bidService.placeBid({
            userId: req.user.id,
            marketId,
            gameTypeId,
            session,
            digit,
            amount
        });

        res.status(201).json({ success: true, data: bid, message: 'Bid placed successfully' });

    } catch (error) {
        next(error);
    }
};

exports.getMyBids = async (req, res, next) => {
    try {
        const { limit, page } = req.query;
        const offset = (page - 1) * limit || 0;
        const bids = await bidService.getUserBids(req.user.id, limit, offset);
        res.json({ success: true, data: bids });
    } catch (error) {
        next(error);
    }
};

exports.getAllBids = async (req, res, next) => {
    try {
        const { limit, page, marketId, session, date, userId } = req.query;
        const offset = (page - 1) * limit || 0;

        const filters = { marketId, session, date, userId };
        const bids = await bidService.getAllBids(filters, limit, offset);
        res.json({ success: true, data: bids });
    } catch (error) {
        next(error);
    }
};
