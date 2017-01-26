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
        this.wechatNewsService = context.module('service.wechat.news');

        this.refactorMedium = (wechatMedium, forEntity) => {
            if (!wechatMedium) {
                return wechatMedium;
            }
            let result = {
                mediaId: wechatMedium.media_id,
                type: wechatMedium.type
            };
            if (wechatMedium.name) {
                result.comment = wechatMedium.name;
            }
            if (forEntity) {
                result.forId = forEntity.Model ? forEntity.id : forEntity._id;
                result.forUsing = forEntity.Model ? forEntity.Model.$schema + "." + forEntity.Model.tableName: 'elasticsearch';
            }
            return result;
        };

        this.mediaPromise = (wechatMedium, forEntity) => {
            return WechatMedia.findOrCreate({
                where: {mediaId: wechatMedium.media_id},
                defaults: this.refactorMedium(wechatMedium, forEntity)
            }).spread((savedMedium, created) => {
                if (created) {
                    logger.warn("Saved new wechat media id|" + savedMedium.id + ", media_id|" + savedMedium.mediaId);
                }
                // else {
                //     logger.warn("Found wechat media id|" + savedMedium.id + ", media_id|" + savedMedium.mediaId);
                // }
                return savedMedium;
            })
        };
    }

    saveMedia(wechatMedia, type) {
        if (!type ||
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
        if (wechatMedium.type == "news") {
            let news = wechatMedium.content;
            news.media_id = wechatMedium.media_id;
            return this.wechatNewsService.saveNewsItem(news)
                .then((savedNews) => {
                    return this.mediaPromise(wechatMedium, savedNews);
                }).catch((e) => {
                    logger.error("Save media with news error, mediaId|" + wechatMedium.media_id + " cause: " + e.stack);
                });
        } else {
            return this.mediaPromise(wechatMedium)
                .catch((e) => {
                    logger.error("Save media error, mediaId|" + wechatMedium.media_id + " cause: " + e.stack);
                });
        }
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