const { fetchDPBossResults } = require('./scraper.service');

async function test() {
    console.log("Testing Scraper...");
    const results = await fetchDPBossResults();
    console.log("Scraper Results:", JSON.stringify(results, null, 2));
}

test();
