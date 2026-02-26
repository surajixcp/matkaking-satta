require('dotenv').config();
const { sequelize, Market, Result } = require("../src/db/models");
const { fetchDPBossResults } = require("../src/services/scraper.service");

function normalizeName(name) {
    if (!name) return null;
    return name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();
}

async function main() {
    await sequelize.authenticate();
    const markets = await Market.findAll({ where: { status: true } });
    const mappedMarkets = markets.map(m => ({
        id: m.id,
        name: m.name,
        normalizedName: normalizeName(m.name)
    }));

    const data = await fetchDPBossResults();
    const results = data.results || [];
    console.log("Extracted Date from DPBoss:", data.date);
    const timeBazarRes = results.find(r => r.game.toUpperCase() === "TIME BAZAR");

    if (timeBazarRes) {
        console.log("Scraped Time Bazar:", timeBazarRes);
        const normalizedGameName = normalizeName(timeBazarRes.game);
        let market = mappedMarkets.find(m => m.normalizedName === normalizedGameName);
        if (!market) {
            market = mappedMarkets.find(m =>
                normalizedGameName.includes(m.normalizedName) ||
                m.normalizedName.includes(normalizedGameName)
            );
        }
        if (market) {
            console.log("Matched DB Market:", market.name);
            const today = new Date().toISOString().split('T')[0];
            const dbResult = await Result.findOne({
                where: { market_id: market.id, date: today }
            });
            console.log("Today's DB Result for Time Bazar:", dbResult ? dbResult.toJSON() : "Not Found");
        } else {
            console.log("No DB Market matched 'TIME BAZAR'. Available:", mappedMarkets.map(m => m.name));
        }
    } else {
        console.log("TIME BAZAR not found in scraped results.");
    }
}

main().catch(console.error).finally(() => process.exit(0));
