require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Market, Result } = require("../src/db/models");

async function checkDb() {
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    await sequelize.authenticate();
    const today = new Date().toISOString().split('T')[0];
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    
    console.log("Checking results for Date:", todayIST);

    const markets = await Market.findAll({
        where: { name: ['TIME BAZAR', 'MADHUR DAY'] },
        include: [{
            model: Result,
            as: 'results',
        }]
    });

    for (const m of markets) {
        console.log(`\nMarket: ${m.name}`);
        m.results.forEach(r => {
            console.log(`  Date: ${r.date} | Open: ${r.open_declare} | Close: ${r.close_declare}`);
        });
    }
}

checkDb().catch(console.error).finally(() => process.exit(0));
