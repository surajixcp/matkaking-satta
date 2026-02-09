const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Result extends Model {
        static associate(models) {
            Result.belongsTo(models.Market, { foreignKey: 'market_id', as: 'market' });
        }
    }

    Result.init({
        market_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Markets', key: 'id' }
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        open_declare: {
            type: DataTypes.STRING,
            allowNull: true
        },
        close_declare: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Result',
        tableName: 'Results',
    });

    return Result;
};
