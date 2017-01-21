
'use strict';

/**
 * @author palmtale
 * @since 2016/12/22.
 */

import Router from 'koa-router';
import WechatRouter from './wechat-event';

import IndexController from '../controllers/index';

const indexController = new IndexController();
const router =  new Router();

router.get('/', async (ctx) => await indexController.index(ctx));
router.use(WechatRouter.routes());

export default router;