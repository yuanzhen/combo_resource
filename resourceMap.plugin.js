/**
 * 生成combo服务需要的resource.php
 * @param {object} options 插件参数
 */
function ResourceMap(options) {
    this.opts = Object.assign({}, options);
    this.allFiles = [];
}

/**
 * webpack自定义插件执行入口
 */
ResourceMap.prototype.apply = function(compiler) {

    let self = this;
    /**
     * 将内存中 assets 内容写到磁盘文件夹之前
     */
    compiler.plugin("emit", function(compilation, callback) {

        self.getStatics(compilation);
        callback();
    });

    /**
     * 编译生成compilation对象时
     */
    compiler.plugin('compilation', function(compilation) {
        //self.addAssets(compilation);
    });

    self.addAssets(compiler);
}

/**
 * 添加额外的assets产物
 */
ResourceMap.prototype.addAssets = function(compiler) {
    let self = this;

    compiler.plugin("emit", function(compilation, callback) {

        let assets = compilation.assets;
        let resourceMap = [];
        let phpAttribute = [];

        for (let key in assets) {

            let files = key.split('.');

            if (key.endsWith('.js')) {
                console.log(files);
                resourceMap.push({
                    key: files[0] + '.js',
                    value: key,
                });

                self.opts.devChunks.forEach(item => {
                    // todo: 和webpack保持一致
                    if (key.indexOf('js/' + item) >= 0) {
                        compilation.assets['dev/' + item + '.js'] = {
                            source: function() {
                                return assets[key].source();
                            },
                            size: function() {
                                return assets[key].source().length;
                            }
                        };
                    }
                })

            }

            if (key.endsWith('.css')) {
                resourceMap.push({
                    key: files[0] + '.css',
                    value: key,
                });

                self.opts.devChunks.forEach(item => {
                    if (key.indexOf('css/' + item) > -1) {
                        compilation.assets['dev/' + item + '.css'] = {
                            source: function() {
                                return assets[key].source();
                            },
                            size: function() {
                                return assets[key].source().length;
                            }
                        };
                    }
                })
            }

        }

        if (resourceMap.length > 0) {
            resourceMap.forEach(function(item) {
                phpAttribute.push(`'${item.key.replace('./','').replace(/^\//,'')}' => '${item.value.replace('./','')}'\n`);
            })
        }

        let source = `<?php\nreturn array(\n'tpl' => array(\n${phpAttribute.join(',')}\n)\n);?>`
        compilation.assets['resource.php'] = {
            source: function() {
                return source;
            },
            size: function() {
                return source.length;
            }
        };
        callback();
    });
}

/**
 * 获取到所有打包输出文件
 */
ResourceMap.prototype.getStatics = function(compilation) {
    let assets = compilation.assets;

    for (let key in assets) {
        this.allFiles.push(key);
    }
}

module.exports = ResourceMap;
