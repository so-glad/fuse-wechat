'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */

import Promisify from '../../../main/js/util/promisify';

describe('queues/wechat-media', () => {
    describe('sync', () => {
        const wechatMediaQueue = context.module('queue.wechat.media');
        return wechatMediaQueue.sync(null);
    });
});
