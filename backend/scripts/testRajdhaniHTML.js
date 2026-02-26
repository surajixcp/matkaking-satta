const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function checkRajdhani() {
    console.log("Fetching DPBoss...");
    const response = await axios.get('https://dpboss.boston/', {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        },
        timeout: 10000
    });
    
    // Save locally to help me see what it looks like
    fs.writeFileSync('temp_dpboss.html', response.data);

    const $ = cheerio.load(response.data);
    
    // Find where RAJDHANI DAY is mentioned
    $('.tkt-val > div').each((i, el) => {
        const text = $(el).text();
        if (text.includes('RAJDHANI DAY')) {
            console.log("\n--- FOUND RAJDHANI DAY BLOCK ---");
            console.log("Raw HTML:");
            console.log($(el).html());
            
            console.log("\nContext around it (parent sibling strings):");
            const parentHTML = $(el).parent().parent().html().substring(0, 500);
            console.log(parentHTML);
        }
    });

}

checkRajdhani().catch(console.error);
