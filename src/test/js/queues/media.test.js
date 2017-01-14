'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */

import Promisify from '../../../main/js/util/promisify';
describe('soglad/fuse-wechat', () => {
    describe('queue/wechat-user', () => {
        const wechatUserQueue = context.module('queue.wechat.user');
        return wechatUserQueue.sync(null);
    });
});