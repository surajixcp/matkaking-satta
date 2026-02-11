const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'bank_name', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'account_number', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'ifsc_code', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'account_holder_name', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'upi_id', {
            type: DataTypes.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'bank_name');
        await queryInterface.removeColumn('Users', 'account_number');
        await queryInterface.removeColumn('Users', 'ifsc_code');
        await queryInterface.removeColumn('Users', 'account_holder_name');
        await queryInterface.removeColumn('Users', 'upi_id');
    }
};
