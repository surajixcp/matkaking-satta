const axios = require("axios");
const cheerio = require("cheerio");

async function fetchDPBossResults() {
    // ⚠️ IMPORTANT TECH NOTE: Use dpboss.family as primary source
    const sources = [
        "https://dpboss.family",
        "https://dpboss.boston",
        "https://dpboss.net"
    ];

    for (const url of sources) {
        try {
            console.log(`[Scraper] Fetching data from ${url}...`);
            const response = await axios.get(url, {
                timeout: 8000, // 8 seconds timeout per source
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = response.data;

            const $ = cheerio.load(html);
            const results = [];
            let scrapedDateStr = null;

            // Extract Date String
            // We look for text like "Date :- 26-02-2026" or "DATE:↬ : 26/02/2026"
            $("*").each((i, el) => {
                const text = $(el).text();
                // Find a string containing the current year and "date" that's relatively short
                const currentYear = new Date().getFullYear().toString();
                if (text && text.toLowerCase().includes("date") && text.includes(currentYear) && text.length < 50) {
                    // Extract DD-MM-YYYY or DD/MM/YYYY using regex
                    const match = text.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
                    if (match) {
                        // Format as YYYY-MM-DD
                        scrapedDateStr = `${match[3]}-${match[2]}-${match[1]}`;
                    }
                }
            });

            // Strategy 1: Look for .tkt-val div containers (Standard dpboss format)
            $(".tkt-val > div").each((i, elem) => {
                let game = $(elem).find("h4").text().trim();
                let number = $(elem).find("span").text().trim();

                if (game && number) {
                    results.push({
                        game,
                        number,
                        fetchedAt: new Date()
                    });
                }
            });

            // Strategy 2: Look for <h4> and adjacent <span>/<h5> (dpboss.family format)
            if (results.length === 0) {
                $("h4").each((i, el) => {
                    const game = $(el).text().trim();
                    const nextTag = $(el).next();
                    if (nextTag.prop('tagName') === 'SPAN' || nextTag.prop('tagName') === 'H5') {
                        const number = nextTag.text().trim();
                        // Verify it looks like a game and a result format
                        if (game.length > 2 && (number.includes('-') || number.length >= 3)) {
                            results.push({
                                game,
                                number,
                                fetchedAt: new Date()
                            });
                        }
                    }
                });
            }

            if (results.length > 0) {
                console.log(`[Scraper] Successfully found ${results.length} results from ${url}. Scraped Date: ${scrapedDateStr || 'Unknown'}`);
                return { date: scrapedDateStr, results }; // Return date + results
            } else {
                console.log(`[Scraper] No results found on ${url}, trying next source...`);
            }

        } catch (err) {
            console.error(`[Scraper] Failed fetching from ${url}:`, err.message);
        }
    }

    console.error("[Scraper] All sources failed fetching results.");
    return { date: null, results: [] };
}

module.exports = {
    fetchDPBossResults
};
