#+++++++++++++++++++++++++++++++++++++++++
# fuse-wechat Docker container in Alpine #
#+++++++++++++++++++++++++++++++++++++++++

FROM soglad/node:lts
LABEL vendor=SoGlad
MAINTAINER Cartoon Zhang<palmtale@glad.so>
ENV APP_HOME=/usr/local/fuse-wechat \
    APP_PORT=5000 \
    APP_VERSION=v1.0.0 \
    GM_VERSION=1.3.25

COPY . $APP_HOME/
RUN set -e \
    && mv $APP_HOME/entry /usr/local/bin/ && chmod u+x /usr/local/bin/entry \
    && rm -rf $APP_HOME/Dockerfile \

    && cd $APP_HOME/ \
    && apk add -U imagemagick libxml2 libpng jpeg freetype libwebp zlib \
               git ca-certificates wget gcc make libc-dev libpng-dev \
               jpeg-dev freetype-dev libwebp-dev libxml2-dev zlib-dev \
    && wget -O GM.tar.xz https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/$GM_VERSION/GraphicsMagick-$GM_VERSION.tar.xz/download \
    && tar -Jxvf GM.tar.xz \
    && cd GraphicsMagick-$GM_VERSION/ \
    && ./configure && make && make install \
    && mv $APP_HOME/etc/config.json /tmp/ \
    && apk del git ca-certificates wget gcc make libc-dev libpng-dev \
               jpeg-dev freetype-dev libwebp-dev libxml2-dev zlib-dev \
    && cd .. && rm -rf GM.tar.xz GraphicsMagick-$GM_VERSION /var/cache/apk/*

WORKDIR $APP_HOME
VOLUME $APP_HOME/var
EXPOSE $APP_PORT
CMD ["entry"]