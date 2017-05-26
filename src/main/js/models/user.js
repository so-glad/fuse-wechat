
'use strict';

/**
 * @author Cartoon
 * @since 16/12/19.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import schemas from "../context/databases";

import Role from "./role";

const databaseSoglad = schemas.soglad,
      logger = log4js.getLogger("fuse-wechat-db");

const User = databaseSoglad.define('user', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: Sequelize.DEFAULT,
        field: 'id'
    },
    username: {
        type: Sequelize.STRING,
        field: 'username',
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        field: 'password'
    },
    salt: {
        type: Sequelize.STRING,
        field: 'salt'
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        default: true,
        field: 'enabled'
    },
    status: {
        type: Sequelize.STRING,
        field: 'status'
    },
    alias: {
        type: Sequelize.STRING,
        field: 'alias'
    },
    avatar: {
        type: Sequelize.STRING,
        field: 'avatar'
    },
    gender: {
        type: Sequelize.STRING,
        field: 'gender'
    },
    email: {
        type: Sequelize.STRING,
        field: 'email',
        unique: true,
        default: ''
    },
    emailVerified: {
        type: Sequelize.BOOLEAN,
        field: 'email_verified',
        default: false
    },
    mobile: {
        type: Sequelize.STRING,
        field: 'mobile',
        unique: true,
        default: ''
    },
    mobileVerified: {
        type: Sequelize.BOOLEAN,
        field: 'mobile_verified',
        default: false
    }
}, {
    schema: 'common',

    tableName: 'user',

    timestamps: true,

    paranoid: false,

    underscored: true
});

User.belongsTo(Role, {as: 'role', foreignKey: 'user_role_id_foreign'});

User.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table common.member.");
    }).catch((e) => {
        logger.error("Error while create/connect table common.member, cause: " + e.message);
    }
);

export default User;