
'use strict';

/**
 * @author palmtale
 * @since 2016/12/22.
 */

import Router from 'koa-router';

import IndexController from '../controllers/index';

const router =  Router();

router.get('/', async (ctx, next) => { await new IndexController(ctx).index(); next()});
 
export default router;