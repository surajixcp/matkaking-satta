require('dotenv').config();
const { ensureDBConnection } = require('../db/models');
const startResultFetcher = require('../cron/fetch-results.cron');

// Manually trigger the fetch logic from the cron file
async function manualTrigger() {
    console.log("Starting Manual Result Fetch Trigger...");
    await ensureDBConnection();

    // We can't directly call the internal function of the cron module easily if it's not exported.
    // However, I modified the cron file to usually export a start function.
    // Wait, the cron file exports `startResultFetcher` which *schedules* the job.
    // It doesn't export the job function itself.

    // To test the logic WITHOUT waiting 1 minute, strict testing requires modifying the cron file to export the worker function too,
    // OR we just move the worker logic to a service.

    // For now, let's just use the fact that the code is in the cron file.
    // I entered the code in the previous step. Let's see...
    // I essentially pasted the logic inside the schedule callback.

    // Plan B: I will Copy-Paste the logic here for the manual trigger 
    // OR arguably better: Refactor `fetch-results.cron.js` to separate the logic.
    // Given user constraints, I'll just replicate the minimal logic here to "simulate" the cron run.

    const { fetchDPBossResults } = require("../services/scraper.service");
    const { ScrapedResult, Market, Result } = require("../db/models");
    const resultsService = require("../app/services/results.service");

    try {
        console.log("Fetching data...");
        const results = await fetchDPBossResults();
        console.log(`Fetched ${results.length} results.`);

        // Re-use logic from cron (simplified for this test script)
        function normalizeName(name) {
            if (!name) return "";
            return name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
        }

        const markets = await Market.findAll({ where: { status: true } });
        const mappedMarkets = markets.map(m => ({ ...m.toJSON(), normalizedName: normalizeName(m.name) }));

        for (const r of results) {
            const normalizedGameName = normalizeName(r.game);
            let market = mappedMarkets.find(m => m.normalizedName === normalizedGameName);
            if (!market) {
                market = mappedMarkets.find(m => normalizedGameName.includes(m.normalizedName) || m.normalizedName.includes(normalizedGameName));
            }

            if (market) {
                console.log(`MATCH: "${r.game}" -> Market: "${market.name}"`);

                // Parse Logic
                const numberString = r.number;
                const parts = numberString.split('-');
                let openPanna = null, openDigit = null, closeDigit = null, closePanna = null;

                if (parts.length === 3) {
                    if (parts[0] !== '***') openPanna = parts[0];
                    if (parts[2] !== '***') closePanna = parts[2];
                    const jodi = parts[1];
                    if (jodi.length === 2 && jodi !== '**') {
                        openDigit = jodi[0];
                        closeDigit = jodi[1];
                    } else if (jodi.length === 1 && jodi !== '*') {
                        openDigit = jodi[0];
                    }
                } else if (parts.length === 2) {
                    if (parts[0].length === 3 && parts[0] !== '***') openPanna = parts[0];
                    if (parts[1].length >= 1 && parts[1] !== '*') openDigit = parts[1][0];
                }

                console.log(`  Parsed: Open=${openPanna}-${openDigit}, Close=${closePanna}-${closeDigit}`);

                // We won't actually WRITE to DB in this dry-run script unless we want to.
                // Let's just log what WOULD happen.

            } else {
                // console.log(`NO MATCH: "${r.game}"`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

manualTrigger();
