const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class WithdrawRequest extends Model {
        static associate(models) {
            WithdrawRequest.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    WithdrawRequest.init({
        user_id: {
            type: DataTypes.INTEGER,
            references: { model: 'Users', key: 'id' }
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        bank_details: {
            type: DataTypes.JSONB, // Snapshot of bank details at time of request
            allowNull: true
        },
        admin_remark: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'WithdrawRequest',
        tableName: 'WithdrawRequests',
    });

    return WithdrawRequest;
};
