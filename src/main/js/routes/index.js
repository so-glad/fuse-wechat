
'use strict';

/**
 * @author palmtale
 * @since 2016/12/22.
 */

import Router from 'koa-router';
import WechatEventRouter from './wechat-event';

import IndexController from '../controllers/index';

const indexController = new IndexController();
const router =  new Router();

router.get('/', async (ctx) => await indexController.index(ctx));
router.use(WechatEventRouter.routes());

export default router;