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
            // We look for text like "23-02-2026 To 01-03-2026"
            let scrapedStartDate = null;
            let scrapedEndDate = null;

            // Regex to find the start and end dates from the raw HTML
            const match = html.match(/(\d{2}[-/]\d{2}[-/]\d{4})[\s\S]{1,50}to[\s\S]{1,50}(\d{2}[-/]\d{2}[-/]\d{4})/i);

            if (match) {
                // Parse DD-MM-YYYY to YYYY-MM-DD
                const startParts = match[1].split(/[-/]/);
                const endParts = match[2].split(/[-/]/);

                scrapedStartDate = `${startParts[2]}-${startParts[1]}-${startParts[0]}`;
                scrapedEndDate = `${endParts[2]}-${endParts[1]}-${endParts[0]}`;
                scrapedDateStr = `${scrapedStartDate} to ${scrapedEndDate}`;
            }

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
                console.log(`[Scraper] Successfully found ${results.length} results from ${url}. Scraped Date Range: ${scrapedDateStr || 'Unknown'}`);
                return {
                    dateStr: scrapedDateStr,
                    startDate: scrapedStartDate,
                    endDate: scrapedEndDate,
                    results
                };
            } else {
                console.log(`[Scraper] No results found on ${url}, trying next source...`);
            }

        } catch (err) {
            console.error(`[Scraper] Failed fetching from ${url}:`, err.message);
        }
    }

    console.error("[Scraper] All sources failed fetching results.");
    return { dateStr: null, startDate: null, endDate: null, results: [] };
}

module.exports = {
    fetchDPBossResults
};
