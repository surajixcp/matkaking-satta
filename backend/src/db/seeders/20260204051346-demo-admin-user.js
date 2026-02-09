'use strict';

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin already exists
    const existing = await queryInterface.rawSelect('Users', {
      where: {
        phone: '9876543210',
      },
    }, ['id']);

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt); // Default password 'password', hashed

      await queryInterface.bulkInsert('Users', [{
        full_name: 'Super Admin',
        phone: '9876543210',
        mpin_hash: hashedPassword, // Schema uses mpin_hash
        role: 'admin',
        device_token: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { phone: '9876543210' }, {});
  }
};
