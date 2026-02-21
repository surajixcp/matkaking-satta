require('dotenv').config();

const { Market } = require('./src/db/models');

async function check() {
    try {
        const market = await Market.findByPk(6);
        console.log("MARKET INFO:", market ? market.toJSON() : "Not found");
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        process.exit();
    }
}
check();
