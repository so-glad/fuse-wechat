
'use strict';

/**
 * @author palmtale
 * @since 2016/12/27.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import databases from '../context/databases';
import context from '../context/config';
import Member from './member';
import WechatUser from './wechat-user';

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatSceneMember = databaseSoglad.define('wechatSceneMember', {
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
        field: 'comment'
    }
}, {
    schema: 'wechat',

    tableName: 'scene_member_' + context.config.wechat.account,

    timestamps: true,

    paranoid: false,

    underscored: true,
});

WechatSceneMember.belongsTo(Member, {as: 'Follower', foreignKey: 'member_id'});
WechatSceneMember.belongsTo(WechatUser, {as: 'FollowerWechat', foreignKey: 'openid'});

WechatSceneMember.sync({force: false})
    .then(function () {
        logger.info("Create/Connect table wechat.scene_member_" + context.config.wechat.account + ".");
    }).catch(function (e) {
        logger.error("Error while create/connect table wechat.scene_member_" + context.config.wechat.account + ", cause: " + e.message);
    }
);

export default WechatSceneMember;