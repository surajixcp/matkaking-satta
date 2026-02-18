const cron = require("node-cron");
const { fetchDPBossResults } = require("../services/scraper.service");
const { ScrapedResult, Market, Result } = require("../db/models");
const resultsService = require("../app/services/results.service");
const { Op } = require("sequelize");

const JOB_SCHEDULE = "*/1 * * * *"; // Every minute

// Helper to clean market names for matching
function normalizeName(name) {
    if (!name) return null;
    // Keep only A-Z, 0-9, and spaces.
    const normalized = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
    return normalized.length > 0 ? normalized : null;
}

// Helper to parse result string
function parseResult(numberString) {
    if (!numberString || numberString.includes("Loading")) return null;

    // Standard format: "290-12-147" OR "290-1" OR "2-147" OR "***-**-***"
    const parts = numberString.split('-');

    let openPanna = null;
    let openDigit = null;
    let closeDigit = null;
    let closePanna = null;

    if (parts.length === 3) {
        // "290-12-147"
        if (parts[0] !== '***') openPanna = parts[0];
        if (parts[2] !== '***') closePanna = parts[2];

        const jodi = parts[1];
        if (jodi.length === 2 && jodi !== '**') {
            openDigit = jodi[0];
            closeDigit = jodi[1];
        } else if (jodi.length === 1 && jodi !== '*') {
            // Sometimes it might just be "1" if close isn't there, but usually it's "**" or "1*"
            openDigit = jodi[0];
        }
    } else if (parts.length === 2) {
        // "290-1" (Open Declared)
        if (parts[0].length === 3 && parts[0] !== '***') {
            openPanna = parts[0];
        }
        if (parts[1].length >= 1 && parts[1] !== '*') {
            openDigit = parts[1][0];
        }
    }

    return { openPanna, openDigit, closePanna, closeDigit };
}

const startResultFetcher = () => {
    console.log(`[Cron] Initializing Result Fetcher Cron (${JOB_SCHEDULE})`);

    cron.schedule(JOB_SCHEDULE, async () => {
        console.log(`[Cron] ${new Date().toISOString()} - Starting Result Fetch...`);

        try {
            const results = await fetchDPBossResults();

            if (results && results.length > 0) {
                let savedCount = 0;
                let declaredCount = 0;

                // 1. Fetch all active markets
                const markets = await Market.findAll({ where: { status: true } });

                // Pre-process local market names for fast matching
                const mappedMarkets = markets.map(m => ({
                    ...m.toJSON(),
                    normalizedName: normalizeName(m.name)
                }));

                for (const r of results) {
                    try {
                        // Custom Logic: Auto-Declare Result
                        const normalizedGameName = normalizeName(r.game);

                        if (!normalizedGameName) continue;

                        // Improved Matching: 
                        // 1. Exact Match
                        // 2. Contains Match (Scraped contains DB name OR DB name contains Scraped)
                        let market = mappedMarkets.find(m => m.normalizedName === normalizedGameName);

                        if (!market) {
                            market = mappedMarkets.find(m =>
                                normalizedGameName.includes(m.normalizedName) ||
                                m.normalizedName.includes(normalizedGameName)
                            );
                        }

                        if (market) {
                            // Save Raw Scrape ONLY if we have a match, to save DB space? 
                            // Or save all? Let's save all for now but maybe limit it later.
                            // Actually, let's only log if we found a market to keep logs clean,
                            // OR save to ScrapedResult standardly.

                            await ScrapedResult.create({
                                game: r.game,
                                number: r.number,
                                fetchedAt: new Date() // Use current time
                            });
                            savedCount++;

                            const parsed = parseResult(r.number);
                            if (parsed) {
                                const today = new Date().toISOString().split('T')[0];

                                // Check if result exists for today
                                let currentResult = await Result.findOne({
                                    where: { market_id: market.id, date: today }
                                });

                                // Declare OPEN
                                if (parsed.openPanna && parsed.openDigit) {
                                    // If result doesn't exist OR open is not declared
                                    if (!currentResult || !currentResult.open_declare) {
                                        console.log(`[Auto-Declare] Found OPEN for ${market.name}: ${parsed.openPanna}-${parsed.openDigit}`);
                                        try {
                                            await resultsService.declareResult({
                                                marketId: market.id,
                                                session: 'Open',
                                                panna: parsed.openPanna,
                                                single: parsed.openDigit,
                                                declaredBy: 'admin'
                                            });
                                            declaredCount++;
                                            console.log(`[Auto-Declare] ✅ OPEN Validated & Declared for ${market.name}`);
                                        } catch (e) {
                                            if (e.message.includes("already declared")) {
                                                // Ignore
                                            } else {
                                                console.error(`[Auto-Declare] ❌ Failed OPEN for ${market.name}:`, e.message);
                                            }
                                        }
                                    }
                                }

                                // Declare CLOSE
                                if (parsed.closePanna && parsed.closeDigit) {
                                    // Refresh logic
                                    currentResult = await Result.findOne({
                                        where: { market_id: market.id, date: today }
                                    });

                                    if (currentResult && currentResult.open_declare && !currentResult.close_declare) {
                                        console.log(`[Auto-Declare] Found CLOSE for ${market.name}: ${parsed.closePanna}-${parsed.closeDigit}`);
                                        try {
                                            await resultsService.declareResult({
                                                marketId: market.id,
                                                session: 'Close',
                                                panna: parsed.closePanna,
                                                single: parsed.closeDigit,
                                                declaredBy: 'admin'
                                            });
                                            declaredCount++;
                                            console.log(`[Auto-Declare] ✅ CLOSE Validated & Declared for ${market.name}`);
                                        } catch (e) {
                                            if (e.message.includes("already declared")) {
                                                // Ignore
                                            } else {
                                                console.error(`[Auto-Declare] ❌ Failed CLOSE for ${market.name}:`, e.message);
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            // Log missing match occasionally?
                            // console.log(`[Cron] No match for scraped game: ${r.game}`);
                        }
                    } catch (innerErr) {
                        console.error(`[Cron] Error processing item ${r.game}:`, innerErr.message);
                    }
                }
                console.log(`[Cron] Processed ${results.length} items. Saved ${savedCount} matches. Auto-declared ${declaredCount} sessions.`);
            } else {
                console.log("[Cron] No results fetched.");
            }
        } catch (error) {
            console.error("[Cron] Error in result fetcher:", error);
        }
    });
};

module.exports = startResultFetcher;
