'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Post extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Post.init({
        text: DataTypes.TEXT,
        platform: DataTypes.STRING,
        sentiment: DataTypes.STRING,
        likes: DataTypes.INTEGER,
        views: { // <-- Добавили новое поле
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Post',
    });
    return Post;
};