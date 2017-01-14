
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import context from '../context/config';
import databases from '../context/databases';


import Member from './member';
import WechatUserInfo from './wechat-user-info';

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatUser = databaseSoglad.define('wechatUser', {
    openid: {
        type: Sequelize.STRING,
        primaryKey: true,
        field: 'openid'
    },
    memberId: {
        type: Sequelize.BIGINT.UNSIGNED,
        field: 'member_id',
        references: {model: Member, key: 'id'}
    },
    unionid: {
        type: Sequelize.STRING,
        references: {model: WechatUserInfo, key: 'unionid'}
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

    tableName: 'user_' + context.config.wechat.account,

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    deletedAt: false,

    paranoid: true
});

WechatUser.belongsTo(Member, {as: 'Member', foreignKey: 'member_id'});
WechatUser.belongsTo(WechatUserInfo, {as: 'WechatUserInfo', foreignKey: 'unionid'});

WechatUser.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat.user_" + context.config.wechat.account);
    }).catch((e) => {
        logger.error("Error while create/connect table wechat.user_" + context.config.wechat.account + ", cause: " + e.message);
    }
);

export default WechatUser;