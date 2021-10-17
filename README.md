# hexo-asset-path

[![npm version](https://badge.fury.io/js/hexo-asset-path.svg)](http://badge.fury.io/js/hexo-asset-path)

In hexo, the images inserted by markdown syntax are often not points to the right place, due to relative path. We can use absolute path to work around this issue. But inserting the post permalink or asset folder every time is very annoying. Also, sometimes we don't like to store that much data on github, we like to move all the images to another CDN. It could be really painful, if you need to update every posts you wrote!

This plugin is written to deal with all these issues. It is trying to make inserting assets to post and integrating with CDN a lot more easier.

## Installation

``` bash
$ npm install hexo-asset-path --save
```

## Usage

### Setting up the configuration in _config.ymal
```
asset_path:
  enable: true

  # Asset folder, used when post asset folder is not enabled.
  # For example, the following asset folder configuration will make hexo to use "/r12f-assets/post-assets/2017-01-16-Hello-World" as the base URL in one of my post.
  asset_folder: /r12f-assets/post_assets/<% print(post_created.format('YYYY-MM-DD')) %>-<%= post_slug %>

  asset_prefix: ..

  # CDN settings, and CDN folder will always be considered to have its own domain and start from the root.
  enable_cdn: true
  cdn_folder: r12f-cdn.azureedge.net/r12f-assets/post_assets/<% print(post_created.format('YYYY-MM-DD')) %>-<%= post_slug %>
  cdn_use_https: false

  # Selectors and attribute names for getting the elements to update.
  selectors:
    img[src]: 'src'
```

Variables you can use in the asset folder and cdn folder:
* post_title
* post_slug
* post_created
* post_created_date
* post_created_time

The variables are supported by underscore template, so you can even execute arbitrary JavaScript code with <% %>. For example, <% print(post_created.format('YYYY-MM-DD') %> will give you 2017-01-01, if today is that day.

### Inserting assets
Just use the markdown syntax to insert your images, with the relative path (to the post asset folder if enabled, otherwise to your asset folder specified in hexo-asset-path configuration).
```
![your image](path/to/image.png)
```

### Asset path in different modes
As we know, we can enable post asset folder in hexo, and hexo can create a local server to preview your blog, and you might like to enable CDN when you generate the real site. The asset path for showing your assets properly in these different modes are actually different. And the following table shows how we generate the asset path:

|                            | Local server                                 | Real site                                                                  |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Post asset folder enabled  | /PostPermalinkPathName/AssetPrefix/AssetPath | (CDN enabled ? //CDNFolder : )/PostPermalinkPathName/AssetPrefix/AssetPath |
| Post asset folder disabled | /AssetFolder/AssetPrefix/AssetPath           | (CDN enabled ? //CDNFolder : /AssetFolder)/AssetPrefix/AssetPath           |

### Debugging
The posts and links we updated is outputted to the hexo log. Just simply enable debug mode and logging in hexo, then you can see it.
```
hexo s --debug --log
```

## License

BSD v3
