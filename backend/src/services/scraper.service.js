const axios = require("axios");
const cheerio = require("cheerio");

async function fetchDPBossResults() {
    // ⚠️ IMPORTANT TECH NOTE: Use multiple sources (dpboss + 2 backups)
    const sources = [
        "https://dpboss.boston",
        "https://dpboss.net",
        "https://dpboss.mobi"
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

            // Strategy: Look for .tkt-val div containers
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

            if (results.length > 0) {
                console.log(`[Scraper] Successfully found ${results.length} results from ${url}.`);
                return results; // Return on first successful scrape
            } else {
                console.log(`[Scraper] No results found on ${url}, trying next source...`);
            }

        } catch (err) {
            console.error(`[Scraper] Failed fetching from ${url}:`, err.message);
        }
    }

    console.error("[Scraper] All sources failed fetching results.");
    return [];
}

module.exports = {
    fetchDPBossResults
};
