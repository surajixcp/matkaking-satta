const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Role extends Model {
        static associate(models) {
            Role.hasMany(models.Admin, { foreignKey: 'role_id', as: 'admins' });
        }
    }

    Role.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        permissions: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'Roles',
        timestamps: true
    });

    return Role;
};
