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
const { choosePort, createCompiler, prepareUrls } = require('react-dev-utils/WebpackDevServerUtils');
const { DEFAULT_PORT, HOST } = require('../config/constant');
const webpackConfigFactory = require('../config/webpack/webpack.config');

/** 是否终端 */
const isInteractive = process.stdout.isTTY;

// 检查必要构建文件存在 -- html模版 、入口文件
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) process.exit(1);

// process.stdout.write(fs.realpathSync(process.cwd()));

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

    const devServer = new WebpackDevServer({ host: HOST, port }, compiler);

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
