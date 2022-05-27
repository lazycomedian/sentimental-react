'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

// 从cache中删除指定的模块 可重新加载
delete require.cache[require.resolve('./paths')];

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) throw new Error('NODE_ENV的环境变量是必须的，但是并没有被声明');

/** 获取项目中的环境变量配置文件 */
const dotenvFilePaths = [
  // 诸如.env.development文件
  `${paths.dotenv}.${NODE_ENV}`,
  // 这里是指.env
  paths.dotenv,
].filter(Boolean);

// 批量配置环境变量文件中的内容
// 如果这个文件 Dotenv不会修改任何环境变量
dotenvFilePaths.forEach(dotenvFilePath => {
  if (fs.existsSync(dotenvFilePath)) {
    const dotenvExpand = require('dotenv-expand');
    dotenvExpand(require('dotenv').config({ path: dotenvFilePath }));
  }
});

// 该文件执行时当前终端所在的绝对文件路径
const appDirectory = fs.realpathSync(process.cwd());

// path.delimiter ---> Windows下输出：';'（分号）; Mac/Linux下输出：':'（冒号）
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter);

/** 自定义环境变量规则需遵循固定的前缀，在这里是 AWESOME_APP_XXX */
const AWESOME_APP = /^AWESOME_APP_/i;

/**
 * @description 获取环境变量的值
 * @param {string} publicUrl
 */
function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => AWESOME_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // 环境变量 未指定环境变量时默认为开发环境
        NODE_ENV: process.env.NODE_ENV || 'development',

        PUBLIC_URL: publicUrl,

        // 是否启用热更新 react reload
        FAST_REFRESH: process.env.FAST_REFRESH !== 'false',
      },
    );

  /** 将所有环境变量配置项的值转化为string类型 可以用于webpack plugin中  */
  const stringified = {
    'process.evn': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;
