'use strict';

/**
 * @author palmtale
 * @since 2017/1/12.
 */

import context from './context';

import WechatUserService from '../services/wechat-user';
import WechatMediaService from '../services/wechat-media';
import WechatSceneService from '../services/wechat-scene';

import WechatController from '../controllers/wechat';
import WechatUserQueue from '../queues/wechat-user';
import WechatMediaQueue from '../queues/wechat-media';

context.register('service.wechat.user', new WechatUserService(context));
context.register('service.wechat.media', new WechatMediaService(context));
context.register('service.wechat.scene', new WechatSceneService(context));
context.register('controller.wechat', new WechatController(context));
context.register('queue.wechat.user', new WechatUserQueue(context));
context.register('queue.wechat.media', new WechatMediaQueue(context));

export default context;