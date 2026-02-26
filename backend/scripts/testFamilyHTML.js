const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

async function check() {
    try {
        console.log("Fetching dpboss.family...");
        const response = await axios.get('https://dpboss.family', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        fs.writeFileSync('temp_dpboss_family.html', response.data);
        console.log("Saved to temp_dpboss_family.html");

        const $ = cheerio.load(response.data);
        const results = [];
        
        // Exact logic from scraper.service.js
        $(".tkt-val > div").each((i, elem) => {
            let game = $(elem).find("h4").text().trim();
            let number = $(elem).find("span").text().trim();

            if (game && number) {
                results.push({ game, number });
            }
        });

        console.log(`Found ${results.length} results using .tkt-val > div`);
        if (results.length > 0) {
            console.log("Sample:", results[0]);
        } else {
            console.log("No results matched the current structure. Let's look for h4 and span.");
            
            // Try another common structure
            let fallbackResults = 0;
            $("h4").each((i, el) => {
                const game = $(el).text().trim();
                const nextTag = $(el).next();
                if (nextTag.prop('tagName') === 'SPAN' || nextTag.prop('tagName') === 'H5') {
                    const number = nextTag.text().trim();
                    if (game.length > 2 && number.includes('-')) {
                        fallbackResults++;
                        if (fallbackResults === 1) console.log("Fallback sample:", { game, number });
                    }
                }
            });
            console.log(`Found ${fallbackResults} results using fallback h4/span logic`);
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}
check();
