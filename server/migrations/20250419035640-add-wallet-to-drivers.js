// migrations/XXXXXXXX-add-wallet-to-drivers.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Drivers', 'wallet', {
      type: Sequelize.DECIMAL(8, 2),
      defaultValue: 0.00
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Drivers', 'wallet');
  }
};