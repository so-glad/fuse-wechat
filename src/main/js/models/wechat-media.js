
'use strict';

/**
 * @author palmtale
 * @since 2016/12/29.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import context from '../context/config';
import schemas from "../context/databases";

const databaseSoglad = schemas.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatMedia = databaseSoglad.define('wechatMedia', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        field: 'id'
    },
    type: {
        type: Sequelize.ENUM('image', 'voice', 'video', 'news'),
        field: 'type'
    },
    mediaId: {
        type: Sequelize.STRING,
        field: 'media_id'
    },
    forUsing: {
        type: Sequelize.STRING,
        field: 'for_using',
        unique: 'media_' + context.config.wechat.account + '_for_unique'
    },
    forId: {
        type: Sequelize.BIGINT.UNSIGNED,
        field: 'for_id',
        unique: 'media_' + context.config.wechat.account + '_for_unique'
    },
    otherId: {
        type: Sequelize.STRING,
        field: 'other_id'
    },
    content: {
        type: Sequelize.JSON,
        field: 'content'
    },
    comment: {
        type: Sequelize.STRING,
        field: 'comment'
    }
}, {
    schema: 'wechat',

    tableName: 'media_' + context.config.wechat.account,

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    deletedAt: false,

    paranoid: true
});


WechatMedia.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat.media_" + context.config.wechat.account + ".");
    }).catch(function (e) {
        logger.error("Error while create/connect table wechat.media_" + context.config.wechat.account + ", cause: " + e.message);
    }
);

export default WechatMedia;