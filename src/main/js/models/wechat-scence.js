
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

const WechatScene = databaseSoglad.define('wechatScene', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: false,
        field: 'id'
    },
    type: {
        type: Sequelize.ENUM('Openid', 'Cooperator'),
        field: 'type',
        default: 'Openid'
    },
    modelId: {
        type: Sequelize.BIGINT.UNSIGNED,
        field: 'model_id',
        default: null
    },
    sceneString: {
        type: Sequelize.STRING,
        field: 'scene_str',
        unique: true
    },
    ticket: {
        type: Sequelize.STRING,
        field: 'ticket'
    },
    expiredSeconds: {
        type: Sequelize.INTEGER,
        field: 'expired_seconds'
    },
    url: {
        type: Sequelize.STRING,
        field: 'url'
    },
    comment: {
        type: Sequelize.STRING,
        field: 'comment'
    }
}, {
    schema: 'wechat',

    tableName: 'scene',

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    deletedAt: false,

    paranoid: true
});

WechatScene.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat.scene.");
    }).catch((e) => {
        logger.error("Error while create/connect table wechat.scene, cause: " + e.message);
    }
);

export default WechatScene;