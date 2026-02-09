'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Check if column exists first (to avoid errors if run multiple times in dev)
        const tableInfo = await queryInterface.describeTable('GameTypes');
        if (!tableInfo.key) {
            await queryInterface.addColumn('GameTypes', 'key', {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'temp_key_default' // Temporary default to allow adding non-null col
            });
            // Remove default after populating unique keys if needed, but for now this is fine.
        }

        // Also check for 'rate' if that was missing in other contexts, but error was 'key'
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('GameTypes', 'key');
    }
};
