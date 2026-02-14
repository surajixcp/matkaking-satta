'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Create Roles table
        await queryInterface.createTable('Roles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            permissions: {
                type: Sequelize.JSONB,
                defaultValue: {}
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 2. Create Admins table
        await queryInterface.createTable('Admins', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            full_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(10),
                allowNull: false,
                unique: true
            },
            pin_hash: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Roles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            status: {
                type: Sequelize.ENUM('active', 'blocked'),
                defaultValue: 'active'
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Admins',
                    key: 'id'
                }
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 3. Seed initial Super Admin role
        const [role] = await queryInterface.bulkInsert('Roles', [{
            name: 'Super Admin',
            permissions: JSON.stringify({
                user_view: true,
                user_edit: true,
                user_delete: true,
                market_manage: true,
                result_declare: true,
                withdraw_approve: true,
                deposit_approve: true,
                settings_edit: true,
                rbac_manage: true
            }),
            description: 'Full system access',
            createdAt: new Date(),
            updatedAt: new Date()
        }], { returning: ['id'] });

        // 4. Seed initial Super Admin user
        // PIN '1234' hashed with bcrypt
        const bcrypt = require('bcryptjs');
        const pinHash = await bcrypt.hash('1234', 10);

        await queryInterface.bulkInsert('Admins', [{
            full_name: 'Super Admin',
            phone: '9999999999',
            pin_hash: pinHash,
            role_id: role.id,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Admins');
        await queryInterface.dropTable('Roles');
    }
};
