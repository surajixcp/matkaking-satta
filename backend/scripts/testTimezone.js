// Test timezone parsing
const currentIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
const dateObj = new Date(currentIST);
const currentHours = dateObj.getHours();
const currentMinutes = dateObj.getMinutes();
const currentTotalMinutes = currentHours * 60 + currentMinutes;

console.log("toLocaleString:", currentIST);
console.log("getHours():", currentHours);
console.log("getMinutes():", currentMinutes);
