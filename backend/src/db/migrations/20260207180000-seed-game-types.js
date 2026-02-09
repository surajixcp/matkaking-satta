'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if data already exists to avoid duplicates if migration loops
        // Ideally we usage bulkInsert
        const gameTypes = [
            { name: 'Single Digit', rate: 9.5, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Jodi Digit', rate: 95.0, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Single Patti', rate: 150.0, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Double Patti', rate: 300.0, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Triple Patti', rate: 700.0, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Half Sangam', rate: 1000.0, createdAt: new Date(), updatedAt: new Date() },
            { name: 'Full Sangam', rate: 10000.0, createdAt: new Date(), updatedAt: new Date() }
        ];

        await queryInterface.bulkInsert('GameTypes', gameTypes, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('GameTypes', null, {});
    }
};
