const { ScrapedResult } = require('../../db/models');

class ScrapedResultsController {
    async getRecent(req, res) {
        try {
            const results = await ScrapedResult.findAll({
                order: [['fetchedAt', 'DESC']],
                limit: 50
            });
            return res.json({ success: true, data: results });
        } catch (error) {
            console.error('Error fetching scraped results:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch results' });
        }
    }
}

module.exports = new ScrapedResultsController();
