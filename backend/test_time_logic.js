const dayMarket = { openH: 10, openM: 0, closeH: 12, closeM: 0 };
const nightMarket = { openH: 22, openM: 0, closeH: 2, closeM: 0 };

function checkMarket(market, timeH, timeM) {
    const openTotalMinutes = market.openH * 60 + market.openM;
    const closeTotalMinutes = market.closeH * 60 + market.closeM;
    const currentTotalMinutes = timeH * 60 + timeM;

    let openSessionOpen = false;
    let closeSessionOpen = false;

    if (openTotalMinutes <= closeTotalMinutes) {
        // Day Market
        openSessionOpen = currentTotalMinutes < openTotalMinutes;
        closeSessionOpen = currentTotalMinutes < closeTotalMinutes;
    } else {
        // Overnight Market
        openSessionOpen = currentTotalMinutes > closeTotalMinutes && currentTotalMinutes < openTotalMinutes;
        closeSessionOpen = currentTotalMinutes <= closeTotalMinutes || currentTotalMinutes >= openTotalMinutes;
    }

    const isOpen = openSessionOpen || closeSessionOpen;

    return {
        time: `${timeH}:${timeM}`,
        open: openSessionOpen,
        close: closeSessionOpen,
        anyOpen: isOpen
    };
}

console.log("DAY MARKET (10:00 to 12:00)");
[8, 11, 13].forEach(h => console.log(checkMarket(dayMarket, h, 0)));

console.log("\nOVERNIGHT MARKET (22:00 to 02:00)");
[20, 23, 1, 3].forEach(h => console.log(checkMarket(nightMarket, h, 0)));
