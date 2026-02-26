const { sequelize, Market, Result } = require("../src/db/models");
const { fetchDPBossResults } = require("../src/services/scraper.service");
const { Op } = require("sequelize");

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

    console.log("DB Markets count:", mappedMarkets.length);
    console.log(mappedMarkets.map(m => m.normalizedName).join(', '));

    const results = await fetchDPBossResults();
    let matches = 0;

    for (const r of results) {
        const normalizedGameName = normalizeName(r.game);
        if (!normalizedGameName) continue;

        let market = mappedMarkets.find(m => m.normalizedName === normalizedGameName);

        if (!market) {
            market = mappedMarkets.find(m =>
                normalizedGameName.includes(m.normalizedName) ||
                m.normalizedName.includes(normalizedGameName)
            );
        }

        if (market) {
            console.log(`Matched DPBoss [${r.game}] -> DB Market [${market.name}]`);
            matches++;
        }
    }
    console.log(`Matched ${matches} out of ${results.length} scraped games.`);
}

main().catch(console.error).finally(() => process.exit(0));
