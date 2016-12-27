
'use strict';

/**
 * @author palmtale
 * @since 2016/12/23.
 */

const fs = require('fs'),
    path = require('path'),

    gulp = require('gulp'),
    clean = require('gulp-clean'),
    watch = require('gulp-watch'),
    eslint = require('gulp-eslint'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    filter = require('gulp-filter'),
    install = require('gulp-install');
    // Docker = require('gulp-docker-tasks');

gulp.task('default', ['server', 'client'], () => {
    return gulp.dest('dest/data/log');
});

/**
 * List all of base directory staff, for copy/move.
 */
const subFolders = (base) => {
    let result = [];
    let files = fs.readdirSync(base);
    for(let i = 0; i < files.length; i ++){
        let fileStat = fs.statSync(path.join(base, files[i]));
        result.push(path.join(base, files[i],  fileStat.isDirectory() ? "/**" : ""));
    }
    return result;
};

gulp.task('clean', () => {
    return gulp.src( 'dest/*', { read: false })
        .pipe(clean({force: true}));
});

gulp.task('develop', () => {
    return watch('src/web/css/**/*.css', { ignoreInitial: false })
        .pipe(gulp.dest('dest/client/css'));
});

gulp.task('lint', () => {
    return gulp.src(['**/*.js','!node_modules/**'])
        .pipe(eslint({
            parser: "babel-eslint",
            extends: "standard",
            env: {
                node: true,
                es6: true,
                mocha: true
            },
            ecmaFeatures: {
                arrowFunctions: true
            },
            rules: {
                "func-style": [2, "declaration", { "allowArrowFunctions": true }]
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', () => {});


gulp.task('server', [ 'dep', 'resources'], () => {
    let jsDir = 'src/main/js';
    return gulp.src(subFolders(jsDir), {base: jsDir})
        .pipe(babel({
            presets: ["es2015-loose", "stage-3"],
            plugins: ["add-module-exports", "transform-runtime"],
            sourceMaps: true,
            retainLines: true
        }))
        /*.pipe(uglify())*/
        .pipe(gulp.dest('dest/server'));
});

/**
 * Server Dependencies build
 */
gulp.task('dep', () => {
    let pkgJson = 'src/main/package.json';
    return gulp.src(pkgJson)
        .pipe(gulp.dest('dest/server'))
        .pipe(install());
});

/**
 * Server View Engine build
 */
gulp.task('resources', () => {
    let hbsDir = 'src/main/resources/';
    return gulp.src(subFolders(hbsDir), {base: hbsDir})
        .pipe(gulp.dest('dest/resources'));
});

gulp.task('client', ['lib'], () => {
    gulp.src('')
});

/**
 * Client Library build
 */
const libKeysDir = {"jquery": "jquery/dist", "bootstrap": "bootstrap/dist", "font-awesome": "font-awesome"};

gulp.task('lib', () => {
    const clientDir = 'src/web';
    gulp.task('lib:install', () => {
        return gulp.src(clientDir + "/package.json")
            .pipe(install());
    });
    gulp.task('lib:move', ['lib:install'], () => {
        const nodeModuleDir = clientDir + "/node_modules/";
        return Object.keys(libKeysDir).forEach((key) => {
            const path = libKeysDir[key];
            return gulp.src(subFolders(nodeModuleDir + path), {base: nodeModuleDir + path})
            /*.pipe(filter(["!.npmignore", "!bower.json", "!package.json", "README.md"]))*/
                .pipe(gulp.dest('dest/client/lib/' + key));
        });
    });
    return gulp.start('lib:move');
});

/**
 * Docker build

gulp.task('docker', ['server', 'client'], () => {
    const docker = new Docker(gulp,{
        sidekick: {
            name:"fuse-wechat",
            repo:"docker.io/soglad/fuse-wechat",
            tags:["latest","1.0.0"],
            dockerfile: 'dest'
        }
    });
    const dockerDir = 'src/docker';
    return gulp.src(subFolders(dockerDir), {base: dockerDir})
        .pipe(gulp.dest('dest'))
        .pipe(gulp.start('docker:image'));
});

gulp.task('docker', [], () => {
    const docker = new Docker();
    const dockerDir = 'src/docker';
    return gulp.src(subFolders(dockerDir), {base: dockerDir})
       .pipe(gulp.dest('dest'))
       .pipe(docker.build());
});
 */