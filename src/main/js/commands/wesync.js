
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import program from 'commander';

import context from '../context/container';

const wechatUserQueue = context.module('queue.wechat.user');
const wechatMediaQueue = context.module('queue.wechat.media');

program.version('0.0.1')
    .option('-u --users <user>', 'Sync User entities', /^(all|medium|small)$/i, 'all')
    .option('-m --media <media>', 'Sync Media entities', /^(all|)$/i, 'all')
    .parse(process.argv);

if(program.users){
    if(program.users == 'all'){
        console.log(program.users);
        wechatUserQueue.sync(null);
    }
}

