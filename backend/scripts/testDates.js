const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const html = (await axios.get('https://dpboss.family', { headers: { 'User-Agent': 'Mozilla/5.0' } })).data;
    const $ = cheerio.load(html);

    // Find SRIDEVI again, but look at the table rows instead of just text
    let srideviParent = null;
    $('h4').each((i, el) => {
        if ($(el).text().trim() === 'SRIDEVI') {
            srideviParent = $(el).parent();
        }
    });

    if (srideviParent) {
        // Now try finding the table where it lives
        const table = srideviParent.closest('table, .satta-result, .game-block');
        console.log("Container:", table.prop('tagName'), table.attr('class'));

        // Let's print the entire raw HTML of the block since the class names indicate it's not a standard table
        console.log(table.html());
    }
}

test();
