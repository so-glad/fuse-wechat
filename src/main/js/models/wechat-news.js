'use strict';

/**
 * @author palmtale
 * @since 2017/1/21.
 */

import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import context from '../context/config';
import schemas from "../context/databases";

const databaseSoglad = schemas.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatNews = databaseSoglad.define('wechatNews', {
    id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: Sequelize.DEFAULT,
        field: 'id'
    },
    thumbMediaId: {
        type: Sequelize.STRING,
        field: 'thumb_media_id'
    },
    thumbUrl: {
        type: Sequelize.STRING,
        field: 'thumb_url'
    },
    mediaId: {
        type: Sequelize.STRING,
        field: 'media_id'
    },
    url: {
        type: Sequelize.STRING,
        field: 'url'
    },
    digest: {
        type: Sequelize.STRING,
        field: 'digest'
    },
    title: {
        type: Sequelize.STRING,
        field: 'title'
    },
    author: {
        type: Sequelize.STRING,
        field: 'author'
    },
    content: {
        type: Sequelize.STRING,
        field: 'content'
    },
    contentSourceUrl: {
        type: Sequelize.STRING,
        field: 'content_source_url'
    },
    showCoverPic: {
        type: Sequelize.BOOLEAN,
        field: 'show_cover_pic'
    },
    createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
    }
}, {
    schema: 'wechat',

    tableName: context.config.wechat.account + '_news' ,

    timestamps: false,

    paranoid: false,

    underscored: true
});

WechatNews.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat." + context.config.wechat.account + "_news.");
    }).catch(function (e) {
        logger.error("Error while create/connect table wechat." + context.config.wechat.account + "_news, cause: " + e.message);
    }
);

export default WechatNews;