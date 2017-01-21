
'use strict';

/**
 * @author palmtale
 * @since 2017/1/10.
 */

import program from 'commander';

import context from '../context/context';

const wechatUserTask = context.module('task.wechat.user');
const wechatMediaTask = context.module('task.wechat.media');

program.version('0.0.1')
    .option('-u --users <user>', 'Sync User entities', /^(all|medium|small)$/i, 'all')
    .option('-m --media <media>', 'Sync Media entities', /^(all|)$/i, 'all')
    .parse(process.argv);

switch (program.users) {

    case 'all': wechatUserTask.sync(null);break;
    default: break;
}

switch (program.media){
    case 'all': wechatMediaTask.sync(null);break;
    default: break;

}
