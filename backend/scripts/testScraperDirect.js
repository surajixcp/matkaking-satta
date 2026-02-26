const { fetchDPBossResults } = require('../src/services/scraper.service');

async function check() {
    const data = await fetchDPBossResults();
    console.log("Date found:", data.date);
    const rajdhani = data.results.find(r => r.game.toUpperCase().includes('RAJDHANI DAY'));
    console.log("Rajdhani Data currently shown by DPBoss:", rajdhani);
}
check();
