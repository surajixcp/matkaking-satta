const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Deposit extends Model {
        static associate(models) {
            Deposit.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Deposit.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
        }
    }

    Deposit.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        utr_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        screenshot_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        admin_remark: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Deposit',
        tableName: 'Deposits',
        timestamps: true
    });

    return Deposit;
};
