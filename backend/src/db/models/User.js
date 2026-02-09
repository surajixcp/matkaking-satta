const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            User.hasOne(models.Wallet, { foreignKey: 'user_id', as: 'wallet' });
            User.hasMany(models.Bid, { foreignKey: 'user_id', as: 'bids' });
            User.hasMany(models.WithdrawRequest, { foreignKey: 'user_id', as: 'withdrawals' });
        }

        // Instance method to check MPIN (using bcrypt if hashed, or direct compare if not yet)
        // Note: In real app, always use hash. For now assuming mpin is stored as hash.
        async validateMpin(enteredMpin) {
            if (!this.mpin_hash) return false;
            return await bcrypt.compare(enteredMpin, this.mpin_hash);
        }

        // Generate JWT Token
        getSignedJwtToken() {
            return jwt.sign({ id: this.id, role: this.role }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE,
            });
        }
    }

    User.init({
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                msg: 'Phone number already registered'
            },
            validate: {
                notEmpty: { msg: 'Phone number cannot be empty' }
            }
        },
        mpin_hash: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user'
        },
        status: {
            type: DataTypes.ENUM('active', 'blocked'),
            defaultValue: 'active'
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        device_token: {
            type: DataTypes.STRING,
            allowNull: true
        },
        profile_pic: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        firebase_uid: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        timestamps: true
    });

    return User;
};
