
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import Queue from '../util/promise-queue';

export default class WechatMediaTask {

    constructor(context){
        this.wechatMediaService = context.module('service.wechat.media');
        this.wechatMediaSyncQueue = new Queue(context.config.wechat.sync.media_queue.concurrency);
    }

}