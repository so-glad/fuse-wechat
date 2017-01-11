
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import Queue from 'promise-queue';

export default class WechatMediaQueue {

    constructor(context){
        this.wechatMediaService = context.module('service.wechat.media');
        this.wechatMediaSyncQueue = new Queue(context.config.wechat.sync.media_queue.concurrency,
            context.config.wechat.sync.media_queue.max);
    }


}