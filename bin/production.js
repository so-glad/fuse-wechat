#!/usr/bin/env node

'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

const path = require('path');

try {
    require(path.join(__dirname, '../dest/server'))
} catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') {
        console.log('run `npm compile` first!');
        process.exit(1);
    }
    console.log('context started with error and exited', e);
    process.exit(1);
}

console.log('context started in production mode');