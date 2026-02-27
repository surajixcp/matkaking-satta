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

    // Normalise DPBoss space formats like "888-4* *" -> "888-4**"
    const cleanedString = numberString.replace(/\s+/g, '');

    // Standard format: "290-12-147" OR "290-1" OR "2-147" OR "***-**-***"
    const parts = cleanedString.split('-');

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
    } else if (parts.length === 4) {
        // "560-1-*-**" (dpboss.family custom format)
        if (parts[0] !== '***') openPanna = parts[0];
        if (parts[1] !== '*') openDigit = parts[1];
        if (parts[2] !== '*') closeDigit = parts[2];
        if (parts[3] !== '***' && parts[3] !== '**') closePanna = parts[3];
    } else if (parts.length === 2) {
        // "888-4**" or "290-1" (Open Declared)
        if (parts[0].length === 3 && parts[0] !== '***') {
            openPanna = parts[0];
        }

        const jodiPart = parts[1];

        if (jodiPart.length >= 1 && jodiPart[0] !== '*') {
            openDigit = jodiPart[0];
        }

        // Handle "4*" where open is 4, close is *
        if (jodiPart.length >= 2 && jodiPart[1] !== '*') {
            closeDigit = jodiPart[1];
        }
    }

    return { openPanna, openDigit, closePanna, closeDigit };
}

const startResultFetcher = () => {
    console.log(`[Cron] Initializing Result Fetcher Cron (${JOB_SCHEDULE})`);

    cron.schedule(JOB_SCHEDULE, async () => {
        console.log(`[Cron] ${new Date().toISOString()} - Starting Result Fetch...`);

        try {
            const data = await fetchDPBossResults();
            const results = data.results || [];
            const { scrapedStartDate, scrapedEndDate, dateStr: scrapedDateStr } = data;

            if (results && results.length > 0) {
                // Determine today's date in IST (YYYY-MM-DD)
                const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;

                if (scrapedStartDate && scrapedEndDate) {
                    const todayDate = new Date(todayIST);
                    const startDate = new Date(scrapedStartDate);
                    const endDate = new Date(scrapedEndDate);

                    if (todayDate >= startDate && todayDate <= endDate) {
                        console.log(`[Cron] ✅ Today (${todayIST}) falls within scraped week range: ${scrapedDateStr}`);
                    } else {
                        console.log(`[Cron] ⚠️ Today (${todayIST}) is OUTSIDE scraped week range (${scrapedDateStr}). Skipping auto-declare.`);
                        return; // Abort
                    }
                } else {
                    console.log(`[Cron] ⚠️ Could not verify scraped date range. Proceeding with caution...`);
                }

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
                        let market = mappedMarkets.find(m => m.normalizedName === normalizedGameName);

                        if (!market) {
                            // 2. Exact match no spaces
                            const noSpaceScraped = normalizedGameName.replace(/\s+/g, '');
                            market = mappedMarkets.find(m => m.normalizedName.replace(/\s+/g, '') === noSpaceScraped);
                        }

                        if (!market) {
                            // 3. Contains match with guard against major prefixes/suffixes like SUPER, NIGHT, DAY
                            market = mappedMarkets.find(m => {
                                const sWords = normalizedGameName.split(/\s+/);
                                const mWords = m.normalizedName.split(/\s+/);

                                // Prevent false positives like SUPER KALYAN matching KALYAN
                                const modifiers = ['SUPER', 'NIGHT', 'DAY', 'MAIN', 'STAR', 'MORNING', 'EVENING'];
                                const hasContradiction = modifiers.some(word =>
                                    (sWords.includes(word) && !mWords.includes(word)) ||
                                    (mWords.includes(word) && !sWords.includes(word))
                                );

                                if (hasContradiction) return false;

                                return normalizedGameName.includes(m.normalizedName) ||
                                    m.normalizedName.includes(normalizedGameName);
                            });
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

                                // Helper to check if current time is correctly past the session time
                                // Handles overnight markets (where open > close)
                                const isSessionPast = (marketObj, sessionType) => {
                                    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                                    const currentMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();

                                    const parseTime = (timeStr) => {
                                        if (!timeStr) return 0;
                                        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                        if (!match) return 0;
                                        let h = parseInt(match[1]);
                                        const m = parseInt(match[2]);
                                        const p = match[3].toUpperCase();
                                        if (p === 'PM' && h < 12) h += 12;
                                        if (p === 'AM' && h === 12) h = 0;
                                        return h * 60 + m;
                                    };

                                    const openMins = parseTime(marketObj.open_time);
                                    const closeMins = parseTime(marketObj.close_time);
                                    let targetMins = sessionType === 'open' ? openMins : closeMins;

                                    if (openMins <= closeMins) {
                                        // Day Market: both events are straightforward
                                        return currentMinutes >= (targetMins - 5);
                                    } else {
                                        // Overnight Market: Crosses midnight (e.g. 21:00 to 09:00)
                                        if (sessionType === 'open') {
                                            // Open is late evening (e.g. 21:00)
                                            return currentMinutes >= (openMins - 5);
                                        } else {
                                            // Close is next morning (e.g. 09:00)
                                            // If it's late evening today, close has NOT passed for THIS business day.
                                            // Close is only past if current time is >= closeMins AND it's the morning (current time < openMins).
                                            if (currentMinutes >= openMins) return false; // Early in the business day (PM)
                                            return currentMinutes >= (closeMins - 5); // Next morning (AM)
                                        }
                                    }
                                };

                                // CRITICAL BUG FIX: Detect if the scraped result is actually from yesterday
                                // A valid result should NEVER have a close digit out BEFORE the market's close time.
                                // If the parsed result has a valid close digit (not '*') but the current time is 
                                // BEFORE the close time, it GUARANTEES this is yesterday's full result lingering on the scraper.
                                const hasValidCloseDigit = parsed.closeDigit && parsed.closeDigit !== '*';
                                const isBeforeCloseTime = !isSessionPast(market, 'close');

                                if (hasValidCloseDigit && isBeforeCloseTime) {
                                    // Log it once in a while or just silently skip so we don't spam.
                                    // console.log(`[Auto-Declare] 🕒 Ignored result for ${market.name} as it contains close digits before close_time (Likely yesterday's result).`);
                                    continue; // Skip this market entirely for today until DPBoss resets it
                                }

                                // Check if result exists for today
                                let currentResult = await Result.findOne({
                                    where: { market_id: market.id, date: today }
                                });

                                // Declare OPEN
                                if (parsed.openPanna && parsed.openDigit) {
                                    // If result doesn't exist OR open is not declared
                                    if (!currentResult || !currentResult.open_declare) {
                                        // CRITICAL CHECK: Make sure current time is actually past the Open Time!
                                        // Otherwise, it's just yesterday's result lingering on DPBoss.
                                        if (isSessionPast(market, 'open')) {
                                            console.log(`[Auto-Declare] Found OPEN for ${market.name}: ${parsed.openPanna}-${parsed.openDigit}`);
                                            try {
                                                await resultsService.declareResult({
                                                    marketId: market.id,
                                                    session: 'Open',
                                                    panna: parsed.openPanna,
                                                    single: parsed.openDigit,
                                                    declaredBy: 'system'
                                                });
                                                declaredCount++;
                                                console.log(`[Auto-Declare] ✅ OPEN Validated & Declared for ${market.name}`);
                                            } catch (e) {
                                                if (!e.message.includes("already declared")) {
                                                    console.error(`[Auto-Declare] ❌ Failed OPEN for ${market.name}:`, e.message);
                                                }
                                            }
                                        } else {
                                            // Debug log
                                            // console.log(`[Auto-Declare] 🕒 Ignored OPEN for ${market.name}. Current time is before open_time (${market.open_time}).`);
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
                                        // CRITICAL CHECK: Ensure time is past Close Time!
                                        if (isSessionPast(market, 'close')) {
                                            console.log(`[Auto-Declare] Found CLOSE for ${market.name}: ${parsed.closePanna}-${parsed.closeDigit}`);
                                            try {
                                                await resultsService.declareResult({
                                                    marketId: market.id,
                                                    session: 'Close',
                                                    panna: parsed.closePanna,
                                                    single: parsed.closeDigit,
                                                    declaredBy: 'system'
                                                });
                                                declaredCount++;
                                                console.log(`[Auto-Declare] ✅ CLOSE Validated & Declared for ${market.name}`);
                                            } catch (e) {
                                                if (!e.message.includes("already declared")) {
                                                    console.error(`[Auto-Declare] ❌ Failed CLOSE for ${market.name}:`, e.message);
                                                }
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
