const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Market extends Model {
        static associate(models) {
            Market.hasMany(models.Bid, { foreignKey: 'market_id', as: 'bids' });
            Market.hasMany(models.Result, { foreignKey: 'market_id', as: 'results' });
        }
    }

    Market.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        open_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        close_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN, // true = active/open for business
            defaultValue: true
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'starline',
            allowNull: false
        },
        is_open_for_betting: {
            type: DataTypes.BOOLEAN, // realtime toggle
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'Market',
        tableName: 'Markets',
    });

    return Market;
};
