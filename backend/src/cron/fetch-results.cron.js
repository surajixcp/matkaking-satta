const cron = require("node-cron");
const { fetchDPBossResults } = require("../services/scraper.service");
const { ScrapedResult, Market, Result } = require("../db/models");
const resultsService = require("../app/services/results.service");
const { Op } = require("sequelize");

const JOB_SCHEDULE = "*/1 * * * *"; // Every minute

// Helper to clean market names for matching
// e.g., "KALYAN MORNING" -> "KALYAN MORNING"
// e.g., "SRIDEVI" -> "SRIDEVI"
function normalizeName(name) {
    if (!name) return "";
    return name.toUpperCase().trim();
}

// Helper to parse result string: "290-12-147"
function parseResult(numberString) {
    if (!numberString || numberString.includes("Loading")) return null;

    // Regex for standard format: "290-12-147" OR "290-1" OR "2-147"
    // Groups: 1=OpenPanna, 2=OpenDigit, 3=CloseDigit, 4=ClosePanna
    // Logic: 
    // Full: XXX-XY-XXX 
    // Open only: XXX-X

    // Let's split by '-'
    const parts = numberString.split('-');

    let openPanna = null;
    let openDigit = null;
    let closeDigit = null;
    let closePanna = null;

    if (parts.length === 3) {
        // "290-12-147" -> 290, 12, 147
        openPanna = parts[0];
        const jodi = parts[1];
        closePanna = parts[2];

        if (jodi.length === 2) {
            openDigit = jodi[0];
            closeDigit = jodi[1];
        }
    } else if (parts.length === 2) {
        // Could be "290-1" (Open Declared) or "1-XXX" (Close?) - Usually standard sites show "290-1..."
        // Checking if the first part is panna (3 digits)
        if (parts[0].length === 3 && parts[1].length >= 1) {
            openPanna = parts[0];
            openDigit = parts[1][0]; // Take first char if it's "1" or "12"(incomplete)
        }
    }

    return { openPanna, openDigit, closePanna, closeDigit };
}

const startResultFetcher = () => {
    console.log(`[Cron] Initializing Result Fetcher Cron (${JOB_SCHEDULE})`);

    cron.schedule(JOB_SCHEDULE, async () => {
        console.log(`[Cron] ${new Date().toISOString()} - Starting DPBoss fetch...`);

        try {
            const results = await fetchDPBossResults();

            if (results.length > 0) {
                let savedCount = 0;
                let declaredCount = 0;

                // 1. Fetch all active markets to match
                const markets = await Market.findAll({ where: { status: true } });

                for (const r of results) {
                    // Save Raw Scrape
                    await ScrapedResult.create({
                        game: r.game,
                        number: r.number,
                        fetchedAt: r.fetchedAt
                    });
                    savedCount++;

                    // Custom Logic: Auto-Declare Result
                    const normalizedGameName = normalizeName(r.game);

                    // Find matching market (Simple approximate match or strict)
                    // We check if local market name is contained in scraped name or vice versa
                    const market = markets.find(m => {
                        const mName = normalizeName(m.name);
                        return normalizedGameName === mName ||
                            normalizedGameName.includes(mName) ||
                            mName.includes(normalizedGameName);
                    });

                    if (market) {
                        const parsed = parseResult(r.number);
                        if (parsed) {
                            const today = new Date().toISOString().split('T')[0];

                            // Check if result exists for today
                            let currentResult = await Result.findOne({
                                where: { market_id: market.id, date: today }
                            });

                            // Declare OPEN if available and not yet declared
                            if (parsed.openPanna && parsed.openDigit) {
                                if (!currentResult || !currentResult.open_declare) {
                                    console.log(`[Auto-Declare] Declaring OPEN for ${market.name}: ${parsed.openPanna}-${parsed.openDigit}`);
                                    try {
                                        await resultsService.declareResult({
                                            marketId: market.id,
                                            session: 'Open',
                                            panna: parsed.openPanna,
                                            single: parsed.openDigit,
                                            declaredBy: 'admin' // System/Bot
                                        });
                                        declaredCount++;
                                    } catch (e) {
                                        console.error(`[Auto-Declare] Failed OPEN for ${market.name}:`, e.message);
                                    }
                                }
                            }

                            // Refresh result to check if we can declare CLOSE now
                            if (parsed.closePanna && parsed.closeDigit) {
                                // We need to fetch again or rely on declareResult's return if we just created it.
                                // But declareResult transaction handles it.
                                // Just check if close is already declared in DB
                                // Note: declareResult updates the DB, so currentResult might be stale if we used the old var

                                currentResult = await Result.findOne({
                                    where: { market_id: market.id, date: today }
                                });

                                if (currentResult && currentResult.open_declare && !currentResult.close_declare) {
                                    console.log(`[Auto-Declare] Declaring CLOSE for ${market.name}: ${parsed.closePanna}-${parsed.closeDigit}`);
                                    try {
                                        await resultsService.declareResult({
                                            marketId: market.id,
                                            session: 'Close',
                                            panna: parsed.closePanna,
                                            single: parsed.closeDigit,
                                            declaredBy: 'admin'
                                        });
                                        declaredCount++;
                                    } catch (e) {
                                        console.error(`[Auto-Declare] Failed CLOSE for ${market.name}:`, e.message);
                                    }
                                }
                            }
                        }
                    }
                }
                console.log(`[Cron] Saved ${savedCount} scraped results. Auto-declared ${declaredCount} game sessions.`);
            } else {
                console.log("[Cron] No results found to save.");
            }
        } catch (error) {
            console.error("[Cron] Error in result fetcher:", error);
        }
    });
};

module.exports = startResultFetcher;
