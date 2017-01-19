'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */


import should from 'should';
import context from '../../../main/js/context/config';

describe('queues/wechat-user', () => {
    describe('sync', () => {
        const wechatUserQueue = context.module('queue.wechat.user');
        return wechatUserQueue.sync(null);
    });
});