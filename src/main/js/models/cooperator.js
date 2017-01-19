
'use strict';

/**
 * @author palmtale
 * @since 2016/12/27.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import databases from "../context/databases";

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const Cooperator = databaseSoglad.define('cooperator', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: Sequelize.DEFAULT,
        field: 'id'
    },
    name: {
        type: Sequelize.STRING,
        field: 'name',
        unique: true
    },
    code: {
        type: Sequelize.STRING,
        field: 'code',
        unique: true
    },
    address: {
        type: Sequelize.STRING,
        field: 'address'
    },
    phone: {
        type: Sequelize.STRING,
        field: 'phone'
    },
    comment: {
        type: Sequelize.STRING,
        field: 'comment'
    }
}, {
    schema: 'basics',

    tableName: 'cooperator',

    timestamps: true,

    paranoid: false,

    underscored: true
});

Cooperator.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table public.cooperator.");
    }).catch((e) => {
        logger.error("Error while create/connect table public.cooperator, cause: " + e.message);
    }
);

export default Cooperator;