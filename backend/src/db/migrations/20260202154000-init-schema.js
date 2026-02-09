'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Users
        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            mpin_hash: {
                type: Sequelize.STRING,
                allowNull: true
            },
            role: {
                type: Sequelize.ENUM('user', 'admin'),
                defaultValue: 'user'
            },
            status: {
                type: Sequelize.ENUM('active', 'blocked'),
                defaultValue: 'active'
            },
            full_name: {
                type: Sequelize.STRING,
                allowNull: true
            },
            device_token: {
                type: Sequelize.STRING, // For FCM
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

        // 2. Wallets
        await queryInterface.createTable('Wallets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            balance: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            bonus: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
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

        // 3. Markets
        await queryInterface.createTable('Markets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            open_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            close_time: {
                type: Sequelize.TIME,
                allowNull: false
            },
            status: {
                type: Sequelize.BOOLEAN, // true = open today
                defaultValue: true
            },
            is_open_for_betting: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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

        // 4. GameTypes
        await queryInterface.createTable('GameTypes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING, // Single, Jodi, Single Patti, Double Patti, Triple Patti, Half Sangam, Full Sangam
                allowNull: false
            },
            rate: {
                type: Sequelize.DECIMAL(10, 2), // e.g. 10 for 1:10
                allowNull: false
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

        // 5. Bids
        await queryInterface.createTable('Bids', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Users', key: 'id' }
            },
            market_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Markets', key: 'id' }
            },
            game_type_id: {
                type: Sequelize.INTEGER,
                references: { model: 'GameTypes', key: 'id' }
            },
            session: {
                type: Sequelize.ENUM('open', 'close'),
                allowNull: false
            },
            digit: {
                type: Sequelize.STRING, // Can be "1", "12", "123", "123-45"
                allowNull: false
            },
            amount: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            win_amount: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0
            },
            status: {
                type: Sequelize.ENUM('pending', 'won', 'lost', 'refunded'),
                defaultValue: 'pending'
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

        // 6. Results
        await queryInterface.createTable('Results', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            market_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Markets', key: 'id' }
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            open_declare: {
                type: Sequelize.STRING, // e.g. "123-6"
                allowNull: true
            },
            close_declare: {
                type: Sequelize.STRING,
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

        // 7. WalletTransactions
        await queryInterface.createTable('WalletTransactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            wallet_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Wallets', key: 'id' }
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('deposit', 'withdraw', 'bid', 'win', 'bonus', 'refund'),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING,
                allowNull: true
            },
            reference_id: {
                type: Sequelize.STRING, // e.g. Bid ID or Payment ID
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

        // 8. WithdrawRequests
        await queryInterface.createTable('WithdrawRequests', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: { model: 'Users', key: 'id' }
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending'
            },
            bank_details: {
                type: Sequelize.JSONB,
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('WithdrawRequests');
        await queryInterface.dropTable('WalletTransactions');
        await queryInterface.dropTable('Results');
        await queryInterface.dropTable('Bids');
        await queryInterface.dropTable('GameTypes');
        await queryInterface.dropTable('Markets');
        await queryInterface.dropTable('Wallets');
        await queryInterface.dropTable('Users');
    }
};
