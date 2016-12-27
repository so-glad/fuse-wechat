
'use strict';

/**
 * @author Cartoon
 * @since 16/12/24.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import schemas from '../context/schemas';
import Member from './member';

const wechatSchema = schemas.wechat,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatUserInfo = wechatSchema.define('wechatUserInfo', {
    unionid: {
        type: Sequelize.STRING,
        primaryKey: true,
        field: 'unionid'
    },
    memberId: {
        type: Sequelize.BIGINT.UNSIGNED,
        field: 'member_id',
        references: {model: Member, key: 'id'}
    },
    nickname: {
        type: Sequelize.STRING,
        field: 'nickname'
    },
    sex: {
        type: Sequelize.INTEGER,
        field: 'sex'
    },
    headimgurl: {
        type: Sequelize.STRING,
        field: 'headimgurl'
    },
    city: {
        type: Sequelize.STRING,
        field: 'city'
    },
    province: {
        type: Sequelize.STRING,
        field: 'province'
    },
    country: {
        type: Sequelize.STRING,
        field: 'country'
    },
    language: {
        type: Sequelize.STRING,
        field: 'language'
    }
}, {
    tableName: 'user_info',

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    deletedAt: false,

    paranoid: true
});

WechatUserInfo.belongsTo(Member, {as: 'Member', foreignKey: 'member_id'});

WechatUserInfo.sync({force: false})
    .then(() => {
        logger.info("Create/Connect table wechat.userInfo.");
    }).catch((e) => {
        logger.error("Error while create/connect table wechat.userInfo, cause: " + e.message);
    }
);

export default WechatUserInfo;