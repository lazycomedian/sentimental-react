const ENV = 'production';

process.env.BABEL_ENV = ENV;
process.env.NODE_ENV = ENV;

process.on('unhandledRejection', err => {
  throw err;
});

require('../config/env');

const paths = require('../config/paths');
const path = require('path');
const fs = require('fs-extra');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
/** react-dev-utils的包分析工具 */
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const webpackConfigFactory = require('../config/webpack/webpack.config');
const webpack = require('webpack');
const chalk = require('react-dev-utils/chalk');
/** 捆绑软件生命周期中精美格式化Webpack消息工具 */
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const printHostingInstructions = require('react-dev-utils/printHostingInstructions');
const printBuildError = require('react-dev-utils/printBuildError');

const useYarn = fs.existsSync(paths.yarnLockFile);

/** 超过一定大小的包需要给出警告 */
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

const config = webpackConfigFactory(ENV);

const { checkBrowsers } = require('react-dev-utils/browsersHelper');

checkBrowsers(paths.appPath, isInteractive)
  .then(() => FileSizeReporter.measureFileSizesBeforeBuild(paths.appBuild))
  .then(previousFileSizes => {
    // 清空打包文件夹中的所有内容
    fs.emptyDirSync(paths.appBuild);

    // 将public下除html外的文件复制到打包文件夹目录
    fs.copySync(paths.appPublic, paths.appBuild, {
      dereference: true,
      filter: file => file !== paths.appHtml,
    });

    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log(
          '\nSearch for the ' + chalk.underline(chalk.yellow('keywords')) + ' to learn more about each warning.',
        );
        console.log('To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n');
      } else {
        // 编译成功
        console.log(chalk.green('Compiled successfully.\n'));
      }

      // 输出gzip压缩后的文件大小
      console.log('File sizes after gzip:\n');
      FileSizeReporter.printFileSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE,
      );

      // 输出主页信息、部署信息及其他信息
      printHostingInstructions(
        require(paths.appPackageJson),
        paths.publicUrlOrPath,
        config.output.publicPath,
        path.relative(process.cwd(), paths.appBuild),
        useYarn,
      );
    },
    err => {
      // 编译是否出现错误
      const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
      if (tscCompileOnError) {
        console.log(
          chalk.yellow(
            'Compiled with the following type errors (you may want to check these before deploying your app):\n',
          ),
        );
        printBuildError(err);
      } else {
        console.log(chalk.red('Failed to compile.\n'));
        printBuildError(err);
        process.exit(1);
      }
    },
  )
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });

// 创建打包的核心方法以及输出打包说明信息
function build(previousFileSizes) {
  // 正在打包
  console.log('Creating an optimized production build...');

  const compiler = webpack(config);

  // 开始执行打包的核心程序
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;

      // 收集错误信息
      if (err) {
        if (!err.message) return reject(err);
        let errMessage = err.message;

        if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
          errMessage += '\nCompileError: Begins at CSS selector ' + err['postcssNode'].selector;
        }
        messages = formatWebpackMessages({ errors: [errMessage], warnings: [] });
      } else {
        messages = formatWebpackMessages(stats.toJson({ all: false, warnings: true, errors: true }));
      }

      if (messages.errors.length) {
        // 只保留第一个错误，待解决后重新打包再继续上移错误，便于阅读
        if (messages.errors.length > 1) messages.errors.length = 1;

        return reject(new Error(messages.errors.join('\n\n')));
      }

      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      });
    });
  });
}
