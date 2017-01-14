
'use strict';

/**
 * @author palmtale
 * @since 2016/10/16.
 */

/** Module import as order: system, third-party, local */

import http from 'http';

import KOA from 'koa';
import log4js from 'koa-log4';
import onError from 'koa-onerror';
import convert from 'koa-convert';
import bodyParser from 'koa-bodyparser';
import json from 'koa-json';
import views from 'koa-views';
import statics from 'koa-static-plus';

import context from './config';
import router from '../routes/index';

const app = new KOA(),
    _use = app.use,
    logger = log4js.getLogger('fuse-wechat');

app.use = (x) => _use.call(app, convert(x));

// middlewares
app.use(log4js.koaLogger(log4js.getLogger("http"), { level: 'auto' }));
app.use(bodyParser());
app.use(json());

// static
app.use(statics(context.config.path.client, {
    pathPrefix: ''
}));

// views
app.use(views(context.config.path.views, {
    extension: 'mustache',
    map: {mustache: 'mustache'}
}));

// 500 error
onError(app, {
    template: context.config.path.views + '/500.mustache'
});

// request perform log
app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    logger.info(`- Perform Log: ${ctx.method} ${ctx.url} - ${ms}ms`);
});

// response router
app.use(router.routes());

// 404
app.use(async (ctx) => {
    ctx.status = 404;
    await ctx.render('404');
});

// error logger
app.on('error', async (err, ctx) => {
    logger.error('error occured:', err);
});

// context.listen(process.env.PORT || 5000);
const port = parseInt(context.config.port || process.env.PORT || '5000'),
      server = http.createServer(app.callback());

server.listen(port);

server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(port + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(port + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
server.on('listening', () => {
    logger.info('Listening on port: %d', port);
});

export default app;