const { ScrapedResult } = require('../../db/models');

class ScrapedResultsController {
    async getRecent(req, res) {
        try {
            // Fetch an oversized chunk to guarantee we capture all unique recent markets despite possible DB clutter
            const rawResults = await ScrapedResult.findAll({
                order: [['fetchedAt', 'DESC']],
                limit: 500
            });

            // Filter down to strictly one unique row per market (the most recent one due to DESC ordering)
            const uniqueGames = new Set();
            const cleanResults = [];

            for (const row of rawResults) {
                if (!uniqueGames.has(row.game)) {
                    uniqueGames.add(row.game);
                    cleanResults.push(row);
                }
                if (cleanResults.length >= 50) break; // We only need the top 50 unique markets
            }

            return res.json({ success: true, data: cleanResults });
        } catch (error) {
            console.error('Error fetching scraped results:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch results' });
        }
    }
}

module.exports = new ScrapedResultsController();
