const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class GameType extends Model {
        static associate(models) {
            GameType.hasMany(models.Bid, { foreignKey: 'game_type_id', as: 'bids' });
        }
    }

    GameType.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false
        },
        rate: {
            type: DataTypes.DECIMAL(10, 2), // e.g., 9.5 or 90
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'GameType',
        tableName: 'GameTypes',
    });

    return GameType;
};
