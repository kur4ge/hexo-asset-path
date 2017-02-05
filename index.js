'use strict';

var path = require('path');
var url = require('url');
var soup = require('soup');
var _ = require('underscore');

var log = hexo.log || log.log;

var postKeys = {
    'post_title' : (config) => config.title,
    'post_slug' : (config) => config.slug,
    'post_created' : (config) => config.date,
    'post_created_date' : (config) => config.date.format(hexo.config.date_format),
    'post_created_time' : (config) => config.date.format(hexo.config.time_format),
};

hexo.extend.filter.register('after_post_render', function(postInfo) {
    var assetPathConfig = hexo.config.asset_path;
    if (!assetPathConfig || !assetPathConfig.enable) {
        return;
    }

    validateConfigurationsAndFailFast(assetPathConfig);

    var options = {
        enable: assetPathConfig.enable,
        createAssetFolder: assetPathConfig.asset_folder ? _.template(assetPathConfig.asset_folder) : null,
        enableCDN: assetPathConfig.enable_cdn,
        createCDNFolder: assetPathConfig.enable_cdn ? _.template(assetPathConfig.cdn_folder) : null,
        cdnUseHttps: assetPathConfig.cdn_use_https,
        selectors: assetPathConfig.selectors ? assetPathConfig.selectors : null,
        isPostAssetFolderEnabled: hexo.config.post_asset_folder,
        isRunningInLocalServerMode: (process.argv.indexOf('server') > -1 || process.argv.indexOf('s') > -1)
    };

    // console.log(options);
    // console.log(postInfo);

    var contentKeys = ['content', 'more', 'excerpt'];
    contentKeys.forEach((contentKey) => {
        postInfo[contentKey] = getPostHtmlWithFixedAssetPaths(options, postInfo, postInfo[contentKey]);
    });

    log.log("Update Asset Links: " + postInfo.path);
});

function validateConfigurationsAndFailFast(assetPathConfig) {
    if (!hexo.config.post_asset_folder && !assetPathConfig.asset_folder) {
        throw new Error("Post asset folder is not enabled, please specify the asset_folder in the configuration.");
    }

    if (assetPathConfig.enable_cdn && !assetPathConfig.cdn_folder) {
        throw new Error("CDN is enabled, please specify the cdn_folder in the configurations.");
    }
}

function getPostHtmlWithFixedAssetPaths(options, postInfo, postContent) {
    var postSoup = new soup(postContent);

    Object.keys(options.selectors).forEach((selector) => {
        var attributeName = options.selectors[selector];
        if (attributeName) {
            postSoup.setAttribute(selector, attributeName, (assetPath) => {
                var fixedAssetPath = fixAssetPath(options, postInfo, assetPath);
                log.log('Asset link fixed: ' + fixedAssetPath);
                return fixedAssetPath;
            });
        }
    });

    return postSoup.toString();
}

function fixAssetPath(options, postInfo, assetPath) {
    if (!assetPath || assetPath.length == 0) {
        return assetPath;
    }

    // If the link is a data URI, we don't need to do anything.
    if (isDataURI(assetPath)) {
        return assetPath;
    }

    // If the link is an absolute URL, we don't need to do anything, because the writer should be confident about where to load the asset.
    if (isAbsoluteURL(assetPath)) {
        return assetPath;
    }

    // Update the asset link based on if we enabled post asset folder and our running mode.
    // The things we need to do in each mode are listed below:
    //                              LocalServer             RealSite
    // PostAssetFolderEnabled       /Permalink/AssetPath    (//CDNFolder||)/Permalink/AssetPath
    // PostAssetFolderDisabled      /AssetFolder/AssetPath  (//CDNFolder||/AssetFolder)/AssetPath
    //
    // Note: The permalink of the post doesn't contain the index.html, so we can directly use it as a folder.
    var fixedAssetPath = assetPath;

    var usePermalink = options.isPostAssetFolderEnabled;
    if (usePermalink) {
        var permalink = url.parse(postInfo.permalink);
        fixedAssetPath = path.join(permalink.pathname, assetPath);
    }

    var useAssetFolder = ((options.isRunningInLocalServerMode && !options.isPostAssetFolderEnabled) || !options.enableCDN);
    var useCDNFolder = (!options.isRunningInLocalServerMode && options.enableCDN);
    if (useAssetFolder) {
        var assetFolderArguments = createFolderTemplateArguments(postInfo);
        var assetFolder = options.createAssetFolder(assetFolderArguments);
        fixedAssetPath = path.join(assetFolder, fixedAssetPath);
    } else if (useCDNFolder) {
        var cdnFolderArguments = createFolderTemplateArguments(postInfo);
        var cdnFolder = options.createCDNFolder(cdnFolderArguments);
        fixedAssetPath = path.join(cdnFolder, fixedAssetPath);
        fixedAssetPath = [ options.cdnUseHttps ? "https://" : "http://", fixedAssetPath ].join('');
    }

    // Fix the path separators from windows.
    return fixedAssetPath.replace(/\\/g, '/');
}

function isDataURI(link) {
    return link.indexOf('data:') === 0;
}

function isAbsoluteURL(link) {
    return link.indexOf('/') === 0 || link.indexOf('://') >= 0;
}

function createFolderTemplateArguments(postInfo) {
    var templateArgs = {};
    Object.keys(postKeys).forEach((key) => { templateArgs[key] = postKeys[key](postInfo); });
    return templateArgs;
}
