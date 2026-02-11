module.exports = (sequelize, DataTypes) => {
    const ScrapedResult = sequelize.define("ScrapedResult", {
        game: {
            type: DataTypes.STRING,
            allowNull: false
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fetchedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ScrapedResults',
        timestamps: true
    });

    return ScrapedResult;
};
