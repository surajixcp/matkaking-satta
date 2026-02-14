const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    class Admin extends Model {
        static associate(models) {
            Admin.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
            Admin.belongsTo(models.Admin, { foreignKey: 'created_by', as: 'creator' });
        }

        async validatePin(enteredPin) {
            return await bcrypt.compare(enteredPin, this.pin_hash);
        }
    }

    Admin.init({
        full_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9]{10}$/
            }
        },
        pin_hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'blocked'),
            defaultValue: 'active'
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Admin',
        tableName: 'Admins',
        timestamps: true
    });

    return Admin;
};
