'use strict';

/**
 * @author palmtale
 * @since 2016/12/19.
 */

import log4js from 'koa-log4';
import ImageUtil from '../util/image';

import WechatMedia from '../models/wechat-media';
import WechatBonusStore from '../models/wechat-bonus-store';
import WechatSceneMember from '../models/wechat-scence-member';


const logger = log4js.getLogger('fuse-wechat');
const imageUtil = new ImageUtil();

export default class WechatEventController {

    constructor(context) {
        this.wechatAccount = context.config.wechat.account;
        this.wechatApi = context.module('client.wechat');
        this.wechatUserService = context.module('service.wechat.user');
        this.wechatSceneService = context.module('service.wechat.scene');
        this.wechatNewsService = context.module('service.wechat.news');


        this.createMemberScene = async(openid) => {
            let userInfo = await this.wechatUserService.findUserInfoByOpenid(openid);
            let wechatScene = await this.wechatSceneService.findUserScene(openid);
            let path = await imageUtil.makeSceneImage(openid, userInfo.headimgurl,
                this.wechatApi.showQRCodeURL(wechatScene.ticket), userInfo.nickname);
            let media = await this.wechatApi.uploadMediaAsync(path, 'image');
            media.clubSceneId = wechatScene.id;
            return media;
        };
    }

    /**
     * @return {string}
     */
    static get SUBSCRIBE_REPLY() {
        return '您好，感谢关注。';
    }

    async handle(ctx) {
        let message = ctx.weixin;
        /* Subscribing Event */
        if (message.Event == "subscribe") {
            logger.info("User subscribed wechat.account[" + this.wechatAccount +
                "], openid[" + message.FromUserName + "].");
            try {
                let userInfo = await this.subscribe(message.FromUserName);
                this.body = {type: "text", content: WechatEventController.SUBSCRIBE_REPLY};
                if (message.EventKey.indexOf("qrscene_") === 0) {
                    let spreadOpenid = message.EventKey.substring(8);
                    logger.info("User.openid[" + message.FromUserName +
                        "] spreaded by user.openid[" + spreadOpenid + "] ");
                    await this.spreaded(spreadOpenid, message.FromUserName, userInfo);
                }
            } catch (e) {
                logger.error("Subscribed error wechat.account[" + this.wechatAccount +
                    "], openid [" + message.FromUserName + "] " + e.stack);
            }
        }
        /* Unsubscribing Event */ else if (message.Event == "unsubscribe") {
            logger.info("User unsubscribed wechat.account[" + this.wechatAccount +
                "], openid[" + message.FromUserName + "].");
        }
        /* Auto location UP event */ else if (message.Event == "LOCATION") {
            logger.info("User opened wechat.account[" + this.wechatAccount +
                "], openid[" + message.FromUserName + "], at location[" +
                message.Latitude + "," + message.Longitude + "," + message.Precision + "]");
        }
        /* Received text/voice message */ else if (message.TYPE == 'text' || message.type == 'voice') {
            this.body = await this.hear(message.Content || message.Recongnize);
        }
        /* Default Event */ else {
            logger.info("Default come from user opened wechat.account[" + this.wechatAccount +
                "], openid[" + message.FromUserName + "]");
        }
    }

    async subscribe(openid) {
        return await this.wechatUserService.findUserInfoByOpenid(openid);
    }

    async spreaded(spreader, follower, userInfo) {
        let wechatSceneMember = await WechatSceneMember.create({
            openid: follower,
            memberId: userInfo.memberId,
            sceneString: spreader
        });
        let wechatBonusStore = await WechatBonusStore.find({where: {openid: wechatSceneMember.sceneString}});
        if (wechatBonusStore) {
            wechatBonusStore.earned = wechatBonusStore.earned + 1.00;
            await wechatBonusStore.save();
        }
        return await this.wechatApi.sendTextAsync(spreader, "[" + userInfo.nickname + "] 通过扫描你的二维码关注了。");
    }

    async spread(openid) {
        let wechatMedia = await WechatMedia.findOne({where: {type: 'Image', otherId: openid, table: ''}});
        let media = wechatMedia;
        if (wechatMedia == null || Date.now() - wechatMedia.updated_at > 3 * 24 * 60 * 60 * 1000) {
            media = await this.createMemberScene(openid);
        }
        if(wechatMedia == null) {//Case of no wechat media
            wechatMedia = await WechatMedia.create({
                type: 'Image', mediaId: media.media_id, otherId: openid,
                tableId: media.clubSceneId, table: 'ubm_wechat.club_scene'
            });
        } else if (media.clubSceneId) { //case of expired club media
            wechatMedia.mediaId = media.media_id;
            wechatMedia.updated_at = Date.now();
            wechatMedia = await wechatMedia.save();
        }
        await this.wechatApi.sendImageAsync(openid, wechatMedia.mediaId);
        let wechatBonusStore = await WechatBonusStore.findOne({where: {openid: openid}});
        await this.wechatApi.sendTextAsync(openid, "" + wechatBonusStore.earned + "元。");
    }

    async hear(content) {
        let newsList = await this.wechatNewsService.findNewsItemsMatchContent(content);
        if (!newsList || newsList.constructor != Array) {
            return newsList;
        }
        let result = [];
        for (let i = 0; i < (newsList.length < 10 ? newsList.length : 10); i++) {
            let savedForm = newsList[i];
            result.push({
                title: savedForm.title,
                description: savedForm.digest,
                picurl: savedForm.thumbUrl,
                url: savedForm.url
            });
        }
        return result;
    }
};