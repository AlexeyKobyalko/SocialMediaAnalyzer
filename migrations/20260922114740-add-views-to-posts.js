'use strict';

module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.addColumn('Posts', 'views', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.removeColumn('Posts', 'views');
    }
};