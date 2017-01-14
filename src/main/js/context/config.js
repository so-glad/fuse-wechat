
'use strict';

/**
 * The application empty context, only serialize config.json into class/object.
 *
 * Since we cannot initialize services in the same js file,
 * it's required to import context.js in order to use context's services.
 *
 *   *Reason: e.g. if Service A would depend on the config in context, A should
 *   import context, then context cannot import A to make a circle dependencies.
 *
 * @author palmtale
 * @since 16/12/19.
 */

import path from 'path';
import log4js from 'koa-log4';

import config from '../../etc/config.json';


log4js.configure(config.log4js, {cwd: config.log4js.cwd});


let refactorConfig = (cfg) => {
    let resultConfig = cfg;
    if (!cfg.path.root) {
        resultConfig.path.root = path.join(__dirname, '../../..');
    }

    if(process.platform == 'windows') {
        if(resultConfig.path.client.indexOf(':\\') !== 1 ) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if(resultConfig.path.server.indexOf(':\\') !== 1 ) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if(resultConfig.path.resources.indexOf(':\\') !== 1 ) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    } else {
        if(resultConfig.path.client.indexOf('/') !== 0 ) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if(resultConfig.path.server.indexOf('/') !== 0 ) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if(resultConfig.path.resources.indexOf('/') !== 0 ) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    }
    resultConfig.path.views = path.join(resultConfig.path.resources, 'views');
    return resultConfig;
};

class Context {

    /**
     * @return {string}
     */
    static get KEY_WECHAT_ACCESSTOKEN() {
        return 'wechat_access_token';
    }

    constructor(cfg){

        this.config = refactorConfig(cfg);

        this.container = {};
    }

    register(name, module) {
        this.container[name] = module;
    }

    module(name) {
        return this.container[name];
    }

}

export default new Context(config);
