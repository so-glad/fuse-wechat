#!/usr/bin/env node

'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

var path = require('path');
var babelCliDir = require('babel-cli/lib/babel/dir');
require('colors');

console.log('>>> [DEBUG]: Debug Mode is an expiremental feature'.cyan);
console.log('>>> [DEBUG]: Compiling...'.green);

babelCliDir({ outDir: 'dest/server', retainLines: true, sourceMaps: true }, [ 'src/main/js' ]); // compile all when start

try {
    require(path.join(__dirname, '../dest/server'))
} catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') {
        console.log('>>> [DEBUG]: run `npm compile` first!');
        process.exit(1);
    }
    console.log('>>> [DEBUG]: App started with error and exited'.red, e);
    process.exit(1);
}

console.log('>>> [DEBUG]: App started in debug mode'.green);
