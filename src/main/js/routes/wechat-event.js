'use strict';

/**
 * @author palmtale
 * @since 2016/12/30.
 */

import log4js from 'koa-log4';
import Router from 'koa-router';

import context from '../context/context';

const logger = log4js.getLogger('fuse-wechat');
const router = new Router({prefix: '/wechat'});
const wechatEventController = context.module('controller.wechat.event');

router.all('/', context.module('server.wechat').middleware(function* () {
    let message = this.weixin;
    /* Subscribing Event */
    if (message.Event == "subscribe") {
        logger.info("User subscribed wechat.account[" + context.config.wechat.account +
            "], openid[" + message.FromUserName + "].");
        let userInfo;
        return wechatEventController.subscribe(message.FromUserName)
            .then((ui) => {
                userInfo = ui;
                this.body = {type: "text", content: subscribe_reply};
            }).then(() => {
                if (message.EventKey.indexOf("qrscene_") === 0) {
                    let spreadOpenid = message.EventKey.substring(8);
                    logger.info("user.openid[" + message.FromUserName +
                        "] spreaded by user.openid[" + spreadOpenid + "] ");
                    return wechatEventController.spreaded(spreadOpenid, message.FromUserName, userInfo);
                } else {
                    return null;
                }
            }).catch((error) => {
                logger.error("Subscribed error wechat.account[" + context.config.wechat.account +
                    "], openid [" + message.FromUserName + "] " + error.stack);
            });
    }
    /* Unsubscribing Event */ else if (message.Event == "unsubscribe") {
        logger.info("User unsubscribed wechat.account[" + context.config.wechat.account +
            "], openid[" + message.FromUserName + "].");
    }
    /* Auto location UP event */ else if (message.Event == "LOCATION") {
        logger.info("User opened wechat.account[" + context.config.wechat.account +
            "], openid[" + message.FromUserName + "], at location[" +
            message.Latitude + "," + message.Longitude + "," + message.Precision + "]");
    }
    /**/ else if (message.TYPE == 'text' || message.type == 'voice') {
        this.body = yield wechatEventController.hear(message.Content || message.Recongnize);
    }
    /* Default Event */else {
        this.body = {type: "text", content: "哎呀，你踩到人家脚了啦"};
    }
}));

export default router;