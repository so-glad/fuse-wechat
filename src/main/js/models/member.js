
'use strict';

/**
 * @author Cartoon
 * @since 16/12/19.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import schemas from "../context/databases";
ß
const databaseSoglad = schemas.soglad,
      logger = log4js.getLogger("fuse-wechat-db");

const Member = databaseSoglad.define('member', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: false,
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
    schema: 'basics',

    tableName: 'member',

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    deletedAt: false,

    paranoid: true
});

Member.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table public.member.");
    }).catch((e) => {
        logger.error("Error while create/connect table public.member, cause: " + e.message);
    }
);

export default Member;