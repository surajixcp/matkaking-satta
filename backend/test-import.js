try {
    console.log('Loading result-fetcher...');
    require('./src/app/services/result-fetcher.service');
    console.log('Success result-fetcher');
} catch (e) {
    console.error('Error loading result-fetcher:', e.message);
}

try {
    console.log('Loading generic routes...');
    require('./src/app/routes');
    console.log('Success generic routes');
} catch (e) {
    console.error('Error loading routes:', e.message);
}
