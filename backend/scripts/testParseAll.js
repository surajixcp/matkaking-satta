require('dotenv').config();
const { fetchDPBossResults } = require("../src/services/scraper.service");

// Helper to parse result string (copied from fetch-results.cron.js)
function parseResult(numberString) {
    if (!numberString || numberString.includes("Loading")) return null;

    // Standard format: "290-12-147" OR "290-1" OR "2-147" OR "***-**-***"
    const parts = numberString.split('-');

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
            openDigit = jodi[0];
        }
    } else if (parts.length === 2) {
        // "290-1" (Open Declared)
        if (parts[0].length === 3 && parts[0] !== '***') {
            openPanna = parts[0];
        }
        if (parts[1].length >= 1 && parts[1] !== '*') {
            openDigit = parts[1][0];
        }
    }

    return { openPanna, openDigit, closePanna, closeDigit };
}

async function main() {
    console.log("Fetching DPBoss results...");
    const results = await fetchDPBossResults();
    console.log(`Fetched ${results.length} results.\n`);

    let parsedCount = 0;
    let failedCount = 0;
    let loadingCount = 0;

    for (const r of results) {
        const parsed = parseResult(r.number);

        if (r.number.includes("Loading") || r.number === "***-**-***") {
            loadingCount++;
            continue;
        }

        if (parsed) {
            // Basic validation
            let isValid = true;
            let issues = [];

            if (parsed.openPanna && parsed.openPanna.length !== 3) {
                isValid = false;
                issues.push(`Invalid openPanna length: ${parsed.openPanna}`);
            }
            if (parsed.closePanna && parsed.closePanna.length !== 3) {
                isValid = false;
                issues.push(`Invalid closePanna length: ${parsed.closePanna}`);
            }
            if (parsed.openDigit && parsed.openDigit.length !== 1) {
                isValid = false;
                issues.push(`Invalid openDigit length: ${parsed.openDigit}`);
            }
            if (parsed.closeDigit && parsed.closeDigit.length !== 1) {
                isValid = false;
                issues.push(`Invalid closeDigit length: ${parsed.closeDigit}`);
            }

            if (isValid || (!parsed.openPanna && !parsed.openDigit && !parsed.closePanna && !parsed.closeDigit)) {
                parsedCount++;
            } else {
                failedCount++;
                console.log(`❌ Failed to parse: [${r.game}] String: "${r.number}" -> Parsed:`, parsed);
                console.log(`   Issues: ${issues.join(', ')}`);
            }
        } else {
            failedCount++;
            console.log(`❌ Returned null for: [${r.game}] String: "${r.number}"`);
        }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total Scraped: ${results.length}`);
    console.log(`Pending/Loading: ${loadingCount}`);
    console.log(`Successfully Parsed: ${parsedCount}`);
    console.log(`Failed to Parse: ${failedCount}`);
}

main().catch(console.error).finally(() => process.exit(0));
