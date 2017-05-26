'use strict';

/**
 * @author palmtale
 * @since 2017/3/30.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import databases from "../context/databases";

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const Role = databaseSoglad.define('role', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: Sequelize.DEFAULT,
        field: 'id'
    },
    name: {
        type: Sequelize.STRING,
        field: 'name'
    },
    code: {
        type: Sequelize.STRING,
        field: 'code'
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        field: 'enabled'
    },
    comment: {
        type: Sequelize.STRING,
        field: 'comment'
    }
}, {
    schema: 'common',

    tableName: 'role',

    timestamps: true,

    paranoid: false,

    underscored: true
});

Role.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table common.role.");
    }).catch((e) => {
        logger.error("Error while create/connect table common.role, cause: " + e.message);
    }
);

export default Role;