const fs = require('fs');
const paths = require('../paths');
const getClientEnvironment = require('../env');
const getOptimization = require('./module/optimization');
const getResolve = require('./module/resolve');
const getPlugins = require('./module/plugins');
const getModule = require('./module/module');
const path = require('path');

/** 是否启用sourcemap 默认启用 */
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

/**
 * 获取webpack配置
 * @param {string} webpackEnv 环境变量
 */
function webpackConfigFactory(webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  /** 环境变量配置 */
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  /** 是否开启热更新 */
  // const shouldUseReactRefresh = env.raw.FAST_REFRESH;

  return {
    target: ['browserslist'],
    mode: webpackEnv,
    /** 生成环境打包出错就中止打包，开发环境中不用中止 */
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',

    entry: paths.appIndexJs,
    infrastructureLogging: { level: 'none' },

    cache: {
      type: 'filesystem',
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig].filter(f => fs.existsSync(f)),
      },
    },
    // 生产环境打包配置
    output: {
      path: paths.appBuild,
      // 添加注释 到文件中
      pathinfo: isEnvDevelopment,
      // 输出的文件名，使用contenthash 进行缓存
      filename: isEnvProduction ? 'static/js/[name].[contenthash:8].js' : isEnvDevelopment && 'static/js/bundle.js',
      // 代码分割 出来的文件会以 chunkFilename进行命名
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
    },
    performance: false,
    optimization: getOptimization(webpackEnv),
    resolve: getResolve(webpackEnv),
    plugins: getPlugins(webpackEnv),
    module: getModule(webpackEnv),
  };
}

module.exports = webpackConfigFactory;

const { createHash } = require('crypto');

function createEnvironmentHash(env) {
  const hash = createHash('md5');
  hash.update(JSON.stringify(env));

  return hash.digest('hex');
}
