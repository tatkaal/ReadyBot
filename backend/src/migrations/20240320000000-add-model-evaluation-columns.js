'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('model_evaluations', 'modelComparisons', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('model_evaluations', 'testCases', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('model_evaluations', 'metrics', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('model_evaluations', 'modelComparisons');
    await queryInterface.removeColumn('model_evaluations', 'testCases');
    await queryInterface.removeColumn('model_evaluations', 'metrics');
  }
}; 