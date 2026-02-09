const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class FcmToken extends Model {
        static associate(models) {
            // Define associations here, e.g., belongsTo User if user_id is present
            // FcmToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    FcmToken.init({
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Optional: ID of the logged-in user'
        },
        platform: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'android, ios, web'
        }
    }, {
        sequelize,
        modelName: 'FcmToken',
        tableName: 'FcmTokens', // Changed table name to match common convention (PascalCase or snake_case plural) usually sequelize uses pluralized model name.
    });

    return FcmToken;
};
