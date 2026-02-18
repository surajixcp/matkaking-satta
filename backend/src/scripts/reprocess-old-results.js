require('dotenv').config();
const { ensureDBConnection, Market } = require('../db/models');
const resultsService = require('../app/services/results.service');

async function reprocessOldResults() {
    console.log("Starting Reprocess Script...");
    await ensureDBConnection();

    // Dates from Screenshot:
    // 16/02/2026 (SRIDEVI)
    // 13/02/2026 (SRIDEVI)
    // 12/02/2026 (MILAN DAY)

    // We need to find Market IDs for SRIDEVI and MILAN DAY first.

    try {
        const sridevi = await Market.findOne({ where: { name: 'SRIDEVI' } });
        const milanDay = await Market.findOne({ where: { name: 'MILAN DAY' } });

        if (!sridevi) console.error("Market SRIDEVI not found!");
        if (!milanDay) console.error("Market MILAN DAY not found!");

        const tasks = [];

        if (sridevi) {
            tasks.push({ marketId: sridevi.id, date: '2026-02-16' });
            tasks.push({ marketId: sridevi.id, date: '2026-02-13' });
        }

        if (milanDay) {
            tasks.push({ marketId: milanDay.id, date: '2026-02-12' });
        }

        console.log(`Found ${tasks.length} tasks to reprocess.`);

        for (const task of tasks) {
            try {
                console.log(`Reprocessing Market ${task.marketId} for Date ${task.date}...`);
                await resultsService.reprocessResults(task.marketId, task.date);
                console.log(`✅ Success for ${task.date}`);
            } catch (error) {
                console.error(`❌ Failed for ${task.date}:`, error.message);
            }
        }

        console.log("Done.");
        process.exit(0);

    } catch (error) {
        console.error("Script Error:", error);
        process.exit(1);
    }
}

reprocessOldResults();
