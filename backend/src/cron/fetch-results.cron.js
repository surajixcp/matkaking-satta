const cron = require("node-cron");
const { fetchDPBossResults } = require("../services/scraper.service");
const { ScrapedResult } = require("../db/models");

const JOB_SCHEDULE = "*/1 * * * *"; // Every minute

const startResultFetcher = () => {
    console.log(`[Cron] Initializing Result Fetcher Cron (${JOB_SCHEDULE})`);

    cron.schedule(JOB_SCHEDULE, async () => {
        console.log(`[Cron] ${new Date().toISOString()} - Starting DPBoss fetch...`);

        try {
            const results = await fetchDPBossResults();

            if (results.length > 0) {
                let savedCount = 0;
                for (const r of results) {
                    await ScrapedResult.create({
                        game: r.game,
                        number: r.number,
                        fetchedAt: r.fetchedAt
                    });
                    savedCount++;
                }
                console.log(`[Cron] Saved ${savedCount} results to database.`);
            } else {
                console.log("[Cron] No results found to save.");
            }
        } catch (error) {
            console.error("[Cron] Error in result fetcher:", error);
        }
    });
};

module.exports = startResultFetcher;
