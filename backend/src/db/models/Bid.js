const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Bid extends Model {
        static associate(models) {
            Bid.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Bid.belongsTo(models.Market, { foreignKey: 'market_id', as: 'market' });
            Bid.belongsTo(models.GameType, { foreignKey: 'game_type_id', as: 'game_type' });
        }
    }

    Bid.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' }
        },
        market_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Markets', key: 'id' }
        },
        game_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'GameTypes', key: 'id' }
        },
        session: {
            type: DataTypes.ENUM('open', 'close'),
            allowNull: false
        },
        digit: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        win_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending', 'won', 'lost', 'refunded'),
            defaultValue: 'pending'
        }
    }, {
        sequelize,
        modelName: 'Bid',
        tableName: 'Bids',
    });

    return Bid;
};
