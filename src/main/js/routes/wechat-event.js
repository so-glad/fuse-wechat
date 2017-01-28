'use strict';

/**
 * @author palmtale
 * @since 2016/12/30.
 */

import Router from 'koa-router';

import context from '../context/context';

const router = new Router({prefix: '/wechat'});
const wechatServer = context.module('server.wechat');
const wechatEventController = context.module('controller.wechat.event');

router.all('/', wechatServer.middleware(wechatEventController.handle));

export default router;