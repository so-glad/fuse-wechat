
'use strict';

/**
 * @author palmtale
 * @since 2016/12/27.
 */


import Sequelize from 'sequelize';
import log4js from 'koa-log4';

import databases from '../context/databases';
import context from '../context/config';
import Member from './user';
import WechatUser from './wechat-user';

const databaseSoglad = databases.soglad,
    logger = log4js.getLogger("fuse-wechat-db");

const WechatSceneMember = databaseSoglad.define('wechatSceneMember', {
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

    tableName: context.config.wechat.account + '_scene_member' ,

    timestamps: true,

    paranoid: false,

    underscored: true,
});

WechatSceneMember.belongsTo(Member, {as: 'Follower', foreignKey: 'member_id'});
WechatSceneMember.belongsTo(WechatUser, {as: 'FollowerWechat', foreignKey: 'openid'});

WechatSceneMember.sync({force: false})
    .then(function () {
        logger.info("Create/Connect table wechat." + context.config.wechat.account + "_scene_member.");
    }).catch(function (e) {
        logger.error("Error while create/connect table wechat." + context.config.wechat.account + "_scene_member, cause: " + e.message);
    }
);

export default WechatSceneMember;