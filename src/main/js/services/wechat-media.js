'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */
import log4js from 'koa-log4';

import WechatMedia from '../models/wechat-media';

const logger = log4js.getLogger('fuse-wechat');

export default class WechatMediaService {

    constructor(context) {
        this.wechatApi = context.module('client.wechat');

        this.refactorContent = (content) => {
            if (!content) {
                return content;
            }
            let news = content.news_item[0];
            news.create_time = content.create_time;
            news.update_time = content.update_time;
            return news;
        };

        this.toWechatMedia = (wechatMedia) => {
            let result = {
                mediaId: wechatMedia.media_id,
                type: wechatMedia.type,
                content: wechatMedia.url
            };
            if (wechatMedia.name) {
                result.comment = wechatMedia.name;
            } else {
                result.content = this.refactorContent(wechatMedia.content);
            }
            return result;
        }
    }

    saveMedia(wechatMedia, type) {
        if(!type ||
            (type != 'image' && type != 'video' && type != 'voice' && type != 'news')) {
            type = 'news'
        }
        let tasks = [];
        for (let i = 0; i < wechatMedia.length; i++) {
            let wechatMedium = wechatMedia[i];
            wechatMedium.type = type;
            tasks.push(this.saveMedium(wechatMedium));
        }
        return Promise.all(tasks);
    }

    saveMedium(wechatMedium) {
        return WechatMedia.findOrCreate({
            where: {mediaId: wechatMedium.media_id},
            defaults: this.toWechatMedia(wechatMedium)
        })
            .spread((savedMedium, created) => {
                if (created) {
                    logger.warn("Saved new wechat media id|" + savedMedium.id + ", media_id|" + savedMedium.mediaId);
                }
                // else {
                //     logger.warn("Found wechat media id|" + savedMedium.id + ", media_id|" + savedMedium.mediaId);
                // }
                return savedMedium;
            }).catch((e) => {
                logger.error("Saved wechat media error, media_id|" + wechatMedium.media_id + ", cause: " + e.stack);
            });
    }

    syncMedia(mediaId) {
        WechatMedia.findOne({where: {mediaId: mediaId}})
            .then((wechatMedia) => {
                if (wechatMedia) {
                    return wechatMedia;
                } else {
                    return this.wechatApi.getMaterial(mediaId);
                }
            }).then((wechatMedia) => {
            if (wechatMedia) {
                return wechatMedia;
            } else {
                return this.wechatApi.getMedia(mediaId);
            }
        }).then((wechatMedia) => {
            if (!wechatMedia) {
                return wechatMedia;
            } else if (wechatMedia.id) {
                return wechatMedia;
            } else {
                return WechatMedia.create({
                    mediaId: wechatMedia.mediaId,
                    content: wechatMedia
                });
            }
        });
    }

}