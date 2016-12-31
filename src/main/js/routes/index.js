
'use strict';

/**
 * @author palmtale
 * @since 2016/12/22.
 */

import Router from 'koa-router';
import WechatRouter from './wechat';

const router =  new Router();
router.get('/', async (ctx) => {await ctx.render('index', {}) });
router.use(WechatRouter.routes());

export default router;