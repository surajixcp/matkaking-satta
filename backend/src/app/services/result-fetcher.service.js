const cron = require('node-cron');
const axios = require('axios');
const { Market, Result, sequelize, ensureDBConnection } = require('../../db/models');
const { sendToTopic } = require('../../utils/push');
// const winningDistributionService = require('./winning-distribution.service');

class ResultFetcherService {
    constructor() {
        this.EXTERNAL_API_URL = 'https://example.com/api/results'; // REPLACE WITH REAL API
        this.isRunning = false;
    }

    /**
     * Initialize Cron Jobs
     */
    init() {
        console.log('Initializing Result Fetcher Service...');

        // Schedule check every 1 minute
        cron.schedule('*/1 * * * *', async () => {
            if (this.isRunning) {
                console.log('Result Fetcher Job already running. Skipping...');
                return;
            }

            this.isRunning = true;
            try {
                // Ensure DB connection before running job
                await ensureDBConnection();
                console.log('Running Result Fetcher Job...');
                await this.fetchAndProcessResults();
            } catch (error) {
                console.error('Error in Result Fetcher Job:', error);
            } finally {
                this.isRunning = false;
            }
        });
    }

    /**
     * Fetch results from external source
     */
    async fetchAndProcessResults() {
        try {
            // Mock Data for now - In real app, use axios.get(this.EXTERNAL_API_URL)
            const mockExternalData = [
                { marketName: 'KALYAN', open: '123', close: '45', date: new Date().toISOString().split('T')[0] },
                { marketName: 'MAIN BAZAR', open: '678', close: '90', date: new Date().toISOString().split('T')[0] }
            ];

            for (const data of mockExternalData) {
                await this.processResult(data);
            }

        } catch (error) {
            console.error('Error fetching results:', error.message);
        }
    }

    /**
     * Process a single result
     */
    async processResult(externalData) {
        const { marketName, open, close, date } = externalData;

        try {
            // 1. Find local market
            const market = await Market.findOne({
                where: { name: marketName } // Ensure names match or use a mapping
            });

            if (!market) return; // Market not found, skip

            // 2. Check if result already exists
            let result = await Result.findOne({
                where: { market_id: market.id, date }
            });

            if (!result) {
                // Create new result
                result = await Result.create({
                    market_id: market.id,
                    date,
                    open_declare: open,
                    close_declare: null // Wait for close
                });

                // Trigger WIN Distribution for OPEN session if needed
                // await winningDistributionService.distributeWins(market.id, 'open', open);

                // ZERO-GRAVITY: Send Push Notification
                await sendToTopic(
                    "results",
                    `📢 ${marketName} Result Declared!`,
                    `Open: ${open}`
                );

            } else {
                // Update existing result if changed
                if (open && result.open_declare !== open) {
                    await result.update({ open_declare: open });
                    // await winningDistributionService.distributeWins(market.id, 'open', open);

                    await sendToTopic(
                        "results",
                        `📢 ${marketName} Open Updated!`,
                        `Open: ${open}`
                    );
                }
                if (close && result.close_declare !== close) {
                    await result.update({ close_declare: close });
                    // await winningDistributionService.distributeWins(market.id, 'close', close);

                    await sendToTopic(
                        "results",
                        `📢 ${marketName} Close Declared!`,
                        `Close: ${close}`
                    );
                }
            }

        } catch (error) {
            console.error(`Error processing result for ${marketName}:`, error.message);
        }
    }
}

module.exports = new ResultFetcherService();
