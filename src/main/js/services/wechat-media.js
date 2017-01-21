'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */
import log4js from 'koa-log4';

import WechatMedia from '../models/wechat-media';
import WechatNews from '../models/wechat-news';
const logger = log4js.getLogger('fuse-wechat');

export default class WechatMediaService {

    constructor(context) {
        this.wechatApi = context.module('client.wechat');

        this.refactorNews = (content) => {
            if (!content) {
                return content;
            }
            let news = content.news_item[0];
            return {
                thumbMediaId: news.thumb_media_id,
                thumbUrl: news.thumb_url,
                url: news.url,
                digest: news.digest,
                title: news.title,
                author: news.author,
                content: news.content,
                contentSourceUrl: news.content_source_url,
                showCoverPic: news.show_cover_pic,
                createdAt: new Date(content.create_time * 1000),
                updatedAt: new Date(content.update_time * 1000)
            };
        };

        this.refactorMedia = (wechatMedia, forEntity) => {
            if (!wechatMedia) {
                return wechatMedia;
            }
            let result = {
                mediaId: wechatMedia.media_id,
                type: wechatMedia.type
            };
            if (wechatMedia.name) {
                result.comment = wechatMedia.name;
            }
            if (forEntity) {
                result.forId = forEntity.id;
                result.forUsing = forEntity.Model.$schema + "." + forEntity.Model.tableName;
            }
            return result;
        };

        this.newsPromise = (wechatMedium) => {
            return WechatNews.findOrCreate({
                where: {mediaId: wechatMedium.media_id},
                defaults: this.refactorNews(wechatMedium.content)
            }).spread((savedNews, created) => {
                if (created) {
                    logger.warn("Saved new wechat news id|" + savedNews.id + ", media_id|" + savedNews.mediaId);
                }
                return savedNews;
            })
        };

        this.mediaPromise = (wechatMedium, forEntity) => {
            return WechatMedia.findOrCreate({
                where: {mediaId: wechatMedium.media_id},
                defaults: this.refactorMedia(wechatMedium, forEntity)
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
            return this.newsPromise(wechatMedium)
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