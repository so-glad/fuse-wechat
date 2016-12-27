
'use strict';

/**
 * @author palmtale
 * @since 2016/12/27.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import schemas from '../context/schemas';
import Member from './member';
import WechatUser from './wechat-user';

const wechatSchema = schemas.wechat,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatSceneMember = wechatSchema.define('wechatSceneMember', {
    openid: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {model: WechatUser, key: 'openid'},
        field: 'openid'
    },
    memberId: {
        type: Sequelize.BIGINT.UNSIGNED,
        field: 'member_id',
        references: {model: Member, key: 'id'}
    },
    sceneString: {
        type: Sequelize.STRING,
        field: 'scene_str'
    },
    comment: {
        type: Sequelize.STRING,
        field: 'enabled'
    }
}, {
    tableName: 'scene_member',

    timestamps: true,

    createdAt: 'timestamp',

    updatedAt: false,

    deletedAt: false,

    paranoid: false
});

WechatSceneMember.belongsTo(Member, {as: 'Follower', foreignKey: 'member_id'});
WechatSceneMember.belongsTo(WechatUser, {as: 'FollowerWechat', foreignKey: 'openid'});

WechatSceneMember.sync({force: false})
    .then(function () {
        logger.info("Create/Connect table wechat.scene_member.");
    }).catch(function (e) {
        logger.error("Error while create/connect table wechat.scene_member, cause: " + e.message);
    }
);

export default WechatSceneMember;