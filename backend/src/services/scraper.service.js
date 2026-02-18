const axios = require("axios");
const cheerio = require("cheerio");

async function fetchDPBossResults() {
    try {
        // Fallback to homepage since /kalyan-result returned 404
        const url = "https://www.dpboss.boston";

        console.log(`[Scraper] Fetching data from ${url}...`);
        const response = await axios.get(url, {
            timeout: 10000, // 10 seconds timeout
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

        // Debug logic removed for production, but can be re-enabled if needed.
        if (results.length === 0) {
            console.log("[Scraper] No results found. Selector might be outdated.");
        }

        console.log(`[Scraper] Found ${results.length} results.`);
        return results;

    } catch (err) {
        console.error("Scraping error:", err.message);
        return [];
    }
}

module.exports = {
    fetchDPBossResults
};
