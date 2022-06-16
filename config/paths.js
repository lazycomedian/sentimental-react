'use strict';

const path = require('path');
const fs = require('fs');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');

// 截取真实文件路径
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
  try {
    const extension = moduleFileExtensions.find(extension => fs.existsSync(resolveFn(`${filePath}.${extension}`)));

    if (extension) {
      return resolveFn(`${filePath}.${extension}`);
    }
  } catch (err) {
    console.log(err);
  }
  return resolveFn(`${filePath}.js`);
};

module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appPublic: resolveApp('public'),
  appBuild: resolveApp(process.env.BUILD_PATH || 'build'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appJsConfig: resolveApp('jsconfig.json'),
  appTsConfig: resolveApp('tsconfig.json'),
  appNodeModules: resolveApp('node_modules'),
  appAssets: resolveApp('src/assets'),
  appDist: resolveApp('dist'),
  appDistStatic: resolveApp('dist/static'),
  appProxyConfig: resolveApp('proxy.config'),
  yarnLockFile: resolveApp('yarn.lock'),
  appTsBuildInfoFile: resolveApp('node_modules/.cache/tsconfig.tsbuildinfo'),
  publicUrlOrPath: getPublicUrlOrPath(
    process.env.NODE_ENV === 'development',
    require(resolveApp('package.json')).homepage,
    process.env.PUBLIC_URL,
  ),
  swSrc: resolveModule(resolveApp, 'src/service-worker'),
};

module.exports.moduleFileExtensions = moduleFileExtensions;
