const { GameType } = require('./backend/src/db/models');

async function checkGameTypes() {
    try {
        const gameTypes = await GameType.findAll();
        console.log("Existing Game Types:");
        gameTypes.forEach(gt => {
            console.log(`ID: ${gt.id}, Name: '${gt.name}', Rate: ${gt.rate}`);
        });
    } catch (error) {
        console.error("Error fetching game types:", error);
    }
}

checkGameTypes();
