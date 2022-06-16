const ENV = 'development';

process.env.NODE_ENV = ENV;
process.env.BABEL_ENV = ENV;

process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const chalk = require('react-dev-utils/chalk');
const paths = require('../config/paths');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const openBrowser = require('react-dev-utils/openBrowser');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const clearConsole = require('react-dev-utils/clearConsole');
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
const { choosePort, createCompiler, prepareUrls, prepareProxy } = require('react-dev-utils/WebpackDevServerUtils');
const webpackConfigFactory = require('../config/webpack/webpack.config');
const getClientEnvironment = require('../config/env');

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

/** 是否终端 */
const isInteractive = process.stdout.isTTY;

// 检查必要构建文件存在 -- html模版 、入口文件
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) process.exit(1);

// process.stdout.write(fs.realpathSync(process.cwd()));
const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

const HOST = process.env.HOST || '0.0.0.0';

/**
 * checkBrowsers
 * 检查端口占用情况并给出提示
 */
checkBrowsers(paths.appPath, isInteractive)
  .then(() => choosePort(HOST, DEFAULT_PORT))
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return Promise.reject('not found a port');
    }

    const urls = prepareUrls(
      process.env.HTTPS === 'true' ? 'https' : 'http',
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1),
    );

    const compiler = createCompiler({
      appName: require(paths.appPackageJson).name,
      useTypeScript: fs.existsSync(paths.appTsConfig),
      useYarn: fs.existsSync(paths.yarnLockFile),
      webpack,
      config: webpackConfigFactory(ENV),
      urls,
    });

    // const proxyConfig = prepareProxy(getProxyConfig(), paths.appPublic, paths.publicUrlOrPath);

    // /** 创建并启动webpack devserver */
    const devServer = new WebpackDevServer(
      {
        host: HOST,
        port,
        proxy: getProxyConfig(),
        /** 声明请求重定向 用于解决本地devserver 刷新后404的问题 */
        historyApiFallback: {
          disableDotRule: true,
          index: paths.publicUrlOrPath,
        },
        /** 如果为 true ，开启虚拟服务器时，为你的代码进行压缩。加快开发流程和优化的作用。 */
        compress: true,
      },
      compiler,
    );

    // 开始后的回调
    devServer.startCallback(() => {
      if (isInteractive) {
        clearConsole();
      }

      console.log(chalk.cyan('Starting the development server...\n'));
      openBrowser(urls.localUrlForBrowser);
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(chalk.yellow(err.message));
    }
    process.exit(1);
  });

/** 获取项目中proxy配置 */
function getProxyConfig() {
  try {
    return require(paths.appProxyConfig);
  } catch (err) {
    return undefined;
  }
}
