const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ReferralTransaction extends Model {
        static associate(models) {
            ReferralTransaction.belongsTo(models.User, { as: 'referrer', foreignKey: 'referrer_id' });
            ReferralTransaction.belongsTo(models.User, { as: 'referred', foreignKey: 'referred_id' });
        }
    }

    ReferralTransaction.init({
        referrer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        referred_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        type: {
            type: DataTypes.ENUM('bonus', 'commission'),
            defaultValue: 'bonus'
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed'),
            defaultValue: 'completed'
        }
    }, {
        sequelize,
        modelName: 'ReferralTransaction',
        tableName: 'ReferralTransactions',
        timestamps: true
    });

    return ReferralTransaction;
};
