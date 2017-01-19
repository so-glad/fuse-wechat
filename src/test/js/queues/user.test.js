'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */


import should from 'should';
import context from '../../../main/js/context/config';

describe('tasks/wechat-user', () => {
    describe('sync', () => {
        const wechatUserQueue = context.module('task.wechat.user');
        return wechatUserQueue.sync(null);
    });
});