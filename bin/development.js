#!/usr/bin/env node

'use strict';

/**
 * @author palmtale
 * @since 2016/12/24.
 */

var fs = require('fs');
var path = require('path');

var projectRootPath = path.resolve(__dirname, '..');
var srcPath = path.join(projectRootPath, 'src/main/js');
var appPath = path.join(projectRootPath, 'dest/server');

var debug = require('debug')('dev');
require('colors');

var log = console.log.bind(console, '>>> [DEV]:'.red);
var babelCliDir = require('babel-cli/lib/babel/dir');
var babelCliFile = require('babel-cli/lib/babel/file');
var chokidar = require('chokidar');
var watcher = chokidar.watch(path.join(__dirname, '../src/main/js'));

watcher.on('ready', function () {
    log('Compiling...'.green);
    babelCliDir({ outDir: 'dest/server', retainLines: true, sourceMaps: true }, [ 'src/main/js' ]);
    require('../dest/server');
    log('♪ App Started'.green);

    watcher
        .on('add', function (absPath) {
            compileFile('src/main/js', 'dest/server', path.relative(srcPath, absPath), cacheClean)
        })
        .on('change', function (absPath) {
            compileFile('src/main/js', 'dest/server', path.relative(srcPath, absPath), cacheClean)
        })
        .on('unlink', function (absPath) {
            var rmfileRelative = path.relative(srcPath, absPath);
            var rmfile = path.join(appPath, rmfileRelative);
            try {
                fs.unlinkSync(rmfile);
                fs.unlinkSync(rmfile + '.map');
            } catch (e) {
                debug('fail to unlink', rmfile);
                return
            }
            console.log('Deleted', rmfileRelative);
            cacheClean()
        });
});


function compileFile (srcDir, outDir, filename, cb) {
    var outFile = path.join(outDir, filename);
    var srcFile = path.join(srcDir, filename);
    try {
        babelCliFile({
            outFile: outFile,
            retainLines: true,
            highlightCode: true,
            comments: true,
            babelrc: true,
            sourceMaps: true
        }, [ srcFile ], { highlightCode: true, comments: true, babelrc: true, ignore: [], sourceMaps: true })
    } catch (e) {
        console.error('Error while compiling file %s', filename, e);
        return
    }
    console.log(srcFile + ' -> ' + outFile);
    cb && cb()
}

function cacheClean () {
    Object.keys(require.cache).forEach(function (id) {
        if (/[\/\\](app)[\/\\]/.test(id)) {
            delete require.cache[id]
        }
    });
    log('♬ App Cache Cleaned...'.green)
}

process.on('exit', function (e) {
    log(' ♫ App Quit'.green)
});