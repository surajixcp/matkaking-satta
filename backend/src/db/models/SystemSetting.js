const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class SystemSetting extends Model {
        static associate(models) {
            // No associations needed for now
        }
    }

    SystemSetting.init({
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        group: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'general'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SystemSetting',
        tableName: 'SystemSettings',
        timestamps: true
    });

    return SystemSetting;
};
