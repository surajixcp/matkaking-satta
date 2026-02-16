const { GameType } = require('./db/models');

async function testGameTypeMatching() {
    try {
        const gameTypes = await GameType.findAll();
        // New Logic Simulation
        const findGT = (keywords) => gameTypes.find(gt => keywords.some(k => gt.name.toLowerCase() === k.toLowerCase() || gt.name.toLowerCase().includes(k.toLowerCase())));
        const getGTByName = (name) => gameTypes.find(gt => gt.name.toLowerCase() === name.toLowerCase());

        const singleGT = getGTByName('Single Digit') || findGT(['single digit']);
        const singlePattiGT = getGTByName('Single Patti') || findGT(['single patti', 'single panna']);

        console.log('Single Digit GT found:', singleGT ? singleGT.name : 'Not Found');
        console.log('Single Patti GT found:', singlePattiGT ? singlePattiGT.name : 'Not Found');

        if (singleGT && singleGT.name !== 'Single Digit') {
            console.error('ERROR: Single Digit GT matched incorrect GameType!');
        } else {
            console.log('SUCCESS: Single Digit correctly identified.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testGameTypeMatching();
