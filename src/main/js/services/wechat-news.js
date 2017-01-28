'use strict';

/**
 * @author palmtale
 * @since 2017/1/26.
 */

import log4js from 'koa-log4';

import WechatNews from '../models/wechat-news';

const logger = log4js.getLogger('fuse-wechat');

export default class WechatNewsService {

    constructor(context) {
        this.wechatAccount = context.config.wechat.account;
        this.elasticSearch = context.module('client.elasticsearch');

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

        this.newsPromise = (news) => {
            return WechatNews.findOrCreate({
                where: {mediaId: news.media_id},
                defaults: this.refactorNews(news)
            }).spread((savedNews, created) => {
                if (created) {
                    logger.warn("Saved new wechat news id|" + savedNews.id + ", media_id|" + savedNews.mediaId);
                }
                return savedNews;
            })
        };

        this.newsElastic = (news) => {
            let meta = {
                index: 'wechat', type: this.wechatAccount + '_news', id: news.media_id,
                body: this.refactorNews(news)
            };
            return this.elasticSearch.index(meta);
        };
    }

    saveNewsItem(news) {
        return this.newsElastic(news);
    }

    async findNewsItemsMatchContent(content) {
        try {
            let result = await this.elasticSearch.search({
                index: 'wechat', type: this.wechatAccount + '_news',
                body: { query: { match: { content: content } } }
            });
            return result.hits.hits;
        } catch (e) {
            logger.error('Find news from search engine error, cause: ' + e.stack);
            return [];
        }
    }
}