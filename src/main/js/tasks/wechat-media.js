
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import log4js from 'koa-log4';

import Queue from '../util/promise-queue';

const logger = log4js.getLogger('fuse-wechat-script');

export default class WechatMediaTask {

    constructor(context){
        this.batchNumber = 100;
        this.wechatApi = context.module('client.wechat');
        this.wechatMediaService = context.module('service.wechat.media');

        this._sync = (type, first, size) => {
            let item_count = 0, total_count = 0;
            return this.wechatApi.getMaterialsAsync(type, first, size)
                .then((materials) => {
                    item_count = materials.item_count;
                    total_count = materials.total_count;
                    return this.wechatMediaService.saveMedia(materials.item, type);
                }).then(() => {
                    logger.info("Sync media end, batch detail: type|" + type + ", first|" + first + ", size|" + size);
                    if(first + item_count < total_count) {
                        return this.sync(type, first + size, size);
                    }
                    return null;
                }).catch((e) => {
                    logger.error("Sync media error, type|" + type + ", first|" + first + ", size|" + size + ", cause: " + e.stack);
                });
        }
    }

    sync(type, first, size) {
        if(!type ||
            (type != 'image' && type != 'video' && type != 'voice' && type != 'news')) {
            type = 'news';
        }
        if(!first) {
            first = 0;
        }
        if(!size) {
            size = 5;
        }
        return this._sync(type, first, size);
    }

}