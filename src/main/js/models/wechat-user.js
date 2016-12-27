
'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import schemas from '../context/schemas';
import Member from './member';
import WechatUserInfo from './wechat-user-info';

const wechatSchema = schemas.wechat,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatUser = wechatSchema.define('wechatUser', {
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
    subscribeTime: {
        type: Sequelize.DATE,
        field: 'subscribe_time'
    }
}, {
    tableName: 'wechat_user',

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
        logger.info("Create/Connect table wechat.user.");
    }).catch((e) => {
        logger.error("Error while create/connect table wechat.user, cause: " + e.message);
    }
);

export default WechatUser;