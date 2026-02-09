'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Otp extends Model {
        static associate(models) {
            // define association here
        }
    }
    Otp.init({
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        otp_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Otp',
    });
    return Otp;
};
