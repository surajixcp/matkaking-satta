const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ReferralSetting extends Model {
        static associate(models) {
            // No associations needed
        }
    }

    ReferralSetting.init({
        bonus_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 50.00
        },
        min_deposit_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 500.00
        },
        is_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        reward_type: {
            type: DataTypes.ENUM('fixed', 'percentage'),
            defaultValue: 'fixed'
        }
    }, {
        sequelize,
        modelName: 'ReferralSetting',
        tableName: 'ReferralSettings',
        timestamps: true
    });

    return ReferralSetting;
};
