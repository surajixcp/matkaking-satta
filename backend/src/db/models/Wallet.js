const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Wallet extends Model {
        static associate(models) {
            Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Wallet.hasMany(models.WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
        }
    }

    Wallet.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        balance: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            get() {
                // Workaround for returning string for decimals
                const value = this.getDataValue('balance');
                return value === null ? null : parseFloat(value);
            }
        },
        bonus: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            get() {
                const value = this.getDataValue('bonus');
                return value === null ? null : parseFloat(value);
            }
        }
    }, {
        sequelize,
        modelName: 'Wallet',
        tableName: 'Wallets',
    });

    return Wallet;
};
