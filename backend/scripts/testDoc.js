const axios = require('axios');
const cheerio = require('cheerio');

async function testFetch() {
    const res = await axios.get('https://dpboss.boston', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const $ = cheerio.load(res.data);
    
    // Find any h4 that contains a date pattern or looks like "Results"
    const dates = [];
    $("*").each((i, el) => {
        const text = $(el).text();
        if (text && text.includes("2026") && text.length < 50) {
            dates.push(text.trim());
        }
    });

    console.log("Found dates:", [...new Set(dates)]);
}

testFetch().catch(console.error);
