'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add approved_by column
        await queryInterface.addColumn('WithdrawRequests', 'approved_by', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // Check if admin_remark exists (model defines it but migration didn't - safe check)
        try {
            await queryInterface.describeTable('WithdrawRequests').then(table => {
                if (!table.admin_remark) {
                    return queryInterface.addColumn('WithdrawRequests', 'admin_remark', {
                        type: Sequelize.STRING,
                        allowNull: true
                    });
                }
            });
        } catch (e) {
            // Fallback if describeTable fails or column doesn't exist
            await queryInterface.addColumn('WithdrawRequests', 'admin_remark', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('WithdrawRequests', 'approved_by');
        await queryInterface.removeColumn('WithdrawRequests', 'admin_remark');
    }
};
