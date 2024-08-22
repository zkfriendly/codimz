"use strict";
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn("Users", "ethereumAddress", {
      type: Sequelize.STRING,
      unique: true,
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn("Users", "ethereumAddress");
  },
};
