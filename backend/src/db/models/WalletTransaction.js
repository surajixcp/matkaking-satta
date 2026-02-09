const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class WalletTransaction extends Model {
        static associate(models) {
            WalletTransaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
        }
    }

    WalletTransaction.init({
        wallet_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Wallets',
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('deposit', 'withdraw', 'bid', 'win', 'bonus', 'refund', 'admin_adjust'),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reference_id: {
            type: DataTypes.STRING, // Can store Bid ID, External Payment ID, etc.
            allowNull: true
        },
        status: { // Optional: useful if we have async deposits
            type: DataTypes.ENUM('success', 'failed', 'pending'),
            defaultValue: 'success'
        }
    }, {
        sequelize,
        modelName: 'WalletTransaction',
        tableName: 'WalletTransactions',
    });

    return WalletTransaction;
};
