var source = './src/',
    assets = 'assets/',
    build = './build/',
    bowerFiles = './bower_components/',
    npmFiles = './node_modules',
    compile = './compile/',
    index = 'index.html',
    root = __dirname,
    gulp_dir = './gulp/',
    fs = require('fs');

module.exports = {
    bowerFiles: bowerFiles,
    npmFiles: npmFiles,
    src: source,
    build: build,
    compile: compile,
    assets: assets,
    appCss: assets + 'styles/',
    appFonts: assets + 'fonts/',
    appImages: assets + 'images/',
    root: root,
    gulp: gulp_dir,
    index: source + index,
    styles: [
        source + '**/*.css',
        source + '**/*.less'
    ],
    templates: [
        '!' + source + index,
        source + 'app/**/*.html'
    ],
    scripts: [
        source + 'app/**/*.js',
        '!' + source + '**/*.spec.js',
        '!' + source + '**/*.test.js'
    ],
    appFiles: [
        build + '**/app.module.js',
        build + '**/common/config/routing.js',
        build + '**/common/config/*.js',
        build + '**/*s.config.js',
        build + '**/*.config.js',
        build + '**/app.run.js',
        build + '**/app.controller.js',
        build + '**/*.js',
        build + '**/*.css',
        source + '**/*.css'
    ],
    wrapper: {
        header: '(function() {\n"use strict";\n',
        footer: '}());'
    },
    templateCacheSettings: {
        standalone: false,
        moduleSystem: 'IIFE',
        module: 'orderCloud'
    },
    ngConstantSettings: {
        name: 'orderCloud',
        deps: false,
        constants: getConstants()
    },
    autoprefixerSettings: {
        browsers: ['last 2 versions'],
        cascade: true
    },
    jsCache: 'jsscripts',
    indentSize: 4,
    checkBootswatchTheme: _checkBootswatchTheme
};

function getConstants() {
    var result = {};
    var constants = JSON.parse(fs.readFileSync(source + 'app/app.constants.json'));
    var environment = process.env.environment || constants.environment;
    switch (environment) {
        case 'local':
            result.authurl = 'http://core.four51.com:11629';
            result.apiurl = 'http://core.four51.com:9002';
            result.rebateCode = 'OnePercentRebate';
            break;
        case 'qa':
            result.authurl = 'https://qaauth.ordercloud.io';
            result.apiurl = 'https://qaapi.ordercloud.io';
            result.rebateCode = 'OnePercentRebate';
            break;
        case 'staging':
            result.authurl = 'https://stagingauth.ordercloud.io';
            result.apiurl = 'https://stagingapi.ordercloud.io';
            result.rebateCode = 'OnePercentRebate';
            break;
        default:
            result.authurl = 'https://auth.ordercloud.io';
            result.apiurl = 'https://api.ordercloud.io';
            result.rebateCode = 'OnePercentRebate';
            break;
    }
    if (process.env.apiurl && process.env.authurl) {
        result.authurl = process.env.authurl;
        result.apiurl = process.env.apiurl;
    }
    else if (!environment && !process.env.apiurl && !process.env.authurl) {
        result.authurl = 'https://auth.ordercloud.io/oauth/token';
        result.apiurl = 'https://api.ordercloud.io';
    }
    result.devapiurl = "http://localhost:7203/api";
    if(process.env.devapiurl) result.devapiurl = process.env.devapiurl;
    if (process.env.clientid) result.clientid = process.env.clientid;
    if (process.env.appname) result.appname = process.env.appname;
    if (process.env.scope) result.scope = process.env.scope;
    if (process.env.ocscope) result.ocscope = process.env.ocscope;
    if (process.env.html5mode) result.html5mode = process.env.html5mode;
    if (process.env.bootswatchtheme) result.bootswatchtheme = process.env.bootswatchtheme;
    if (process.env.catalogid) result.catalogid = process.env.catalogid;
    return result;
}

function _checkBootswatchTheme() {
    var bootswatchBower = {};
    var constants = JSON.parse(fs.readFileSync(source + 'app/app.constants.json'));

    var theme = process.env.bootswatchtheme || constants.bootswatchtheme;

    if (theme) {
        bootswatchBower.main = [
            "./" + theme + "/bootswatch.less",
            "./" + theme + "/variables.less"
        ]
    }

    return bootswatchBower;
}
