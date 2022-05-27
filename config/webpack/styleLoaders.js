'use strict';

const paths = require('../paths');

const path = require('path');

const fs = require('fs');

/** 这个插件将CSS提取成单独的文件。它为每个包含CSS的JS文件创建一个CSS文件。它支持CSS和SourceMaps的按需加载。 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/** 是否启用sourcemap 默认启用 */
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

/** 检查是否使用了tailwind */
const useTailwind = fs.existsSync(path.join(paths.appPath, 'tailwind.config.js'));

/**
 * 封装styleloaders以复用
 * @param {string} webpackEnv 当前环境变量
 * @param cssOptions
 * @param preProcessor
 */
function getStyleLoaders(webpackEnv, cssOptions, preProcessor) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  const loaders = [
    isEnvDevelopment && require.resolve('style-loader'),
    isEnvProduction && {
      loader: MiniCssExtractPlugin.loader,
      // 如果是.开头则为相对路径 指定publicPath 反之则不指定
      options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {},
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          ident: 'postcss',
          config: false,
          plugins: !useTailwind
            ? [
                // postcss
                'postcss-flexbugs-fixes',
                ['postcss-preset-env', { autoprefixer: { flexbox: 'no-2009' }, stage: 3 }],
                'postcss-normalize',
              ]
            : [
                // tailwindcss
                'tailwindcss',
                'postcss-flexbugs-fixes',
                ['postcss-preset-env', { autoprefixer: { flexbox: 'no-2009' }, stage: 3 }],
              ],
        },
        sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
      },
    },
  ].filter(Boolean);

  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve('resolve-url-loader'),
        options: { sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment, root: paths.appSrc },
      },
      { loader: require.resolve(preProcessor), options: { sourceMap: true } },
    );
  }

  return loaders;
}

module.exports = getStyleLoaders;
