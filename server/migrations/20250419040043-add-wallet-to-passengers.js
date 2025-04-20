// migrations/XXXXXXXX-add-wallet-to-passengers.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Passengers', 'wallet', {
      type: Sequelize.DECIMAL(8, 2),
      defaultValue: 0.00
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Passengers', 'wallet');
  }
};