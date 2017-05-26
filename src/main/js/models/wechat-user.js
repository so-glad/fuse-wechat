
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import context from '../context/config';
import databases from '../context/databases';


import User from './user';
import WechatUserInfo from './wechat-user-info';

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatUser = databaseSoglad.define('wechatUser', {
    openid: {
        type: Sequelize.STRING,
        primaryKey: true,
        field: 'openid'
    },
    accessToken: {
        type: Sequelize.STRING,
        field: 'access_token'
    },
    refreshToken: {
        type: Sequelize.STRING,
        field: 'refresh_token'
    },
    refreshTime: {
        type: Sequelize.DATE,
        field: 'refresh_time'
    },
    accessPeriod: {
        type: Sequelize.INTEGER,
        field: 'access_period'
    },
    remark: {
        type: Sequelize.STRING,
        field: 'remark'
    },
    groupid: {
        type: Sequelize.STRING,
        field: 'groupid'
    },
    subscribed: {
        type: Sequelize.BOOLEAN,
        field: 'subscribed'
    },
    subscribeTime: {
        type: Sequelize.DATE,
        field: 'subscribe_time'
    }
}, {
    schema: 'wechat',

    tableName: context.config.wechat.account + '_user',

    timestamps: true,

    paranoid: false,

    underscored: true
});

WechatUser.belongsTo(User, {as: 'User', foreignKey: 'user_id'});
WechatUser.belongsTo(WechatUserInfo, {as: 'WechatUserInfo', foreignKey: 'unionid'});

WechatUser.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat." + context.config.wechat.account + "_user" );
    }).catch((e) => {
        logger.error("Error while create/connect table wechat." + context.config.wechat.account + "_user, cause: " + e.message);
    }
);

export default WechatUser;