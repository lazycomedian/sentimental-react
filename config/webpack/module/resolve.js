'use strict';
const paths = require('../../paths');
const fs = require('fs');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const aliases = require('../../aliases');

const useTypeScript = fs.existsSync(paths.appTsConfig);

/** babel配置包引用路径  // todo 暂时使用用react-app(后期需维护) */
const babelRuntimeEntry = require.resolve('babel-preset-react-app');

/** babel运行时提示文件路径 */
const babelRuntimeEntryHelpers = require.resolve('@babel/runtime/helpers/esm/assertThisInitialized', {
  paths: [babelRuntimeEntry],
});
const babelRuntimeRegenerator = require.resolve('@babel/runtime/regenerator', {
  paths: [babelRuntimeEntry],
});

module.exports = webpackEnv => {
  const isEnvProduction = webpackEnv === 'production';

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');

  return {
    // This allows you to set a fallback for where webpack should look for modules.
    // We placed these paths second because we want `node_modules` to "win"
    // if there are any conflicts. This matches Node resolution mechanism.
    // https://github.com/facebook/create-react-app/issues/253
    modules: ['node_modules', paths.appNodeModules].concat(aliases.additionalModulePaths || []),
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebook/create-react-app/issues/290
    // `web` extension prefixes have been added for better support
    // for React Native Web.
    extensions: paths.moduleFileExtensions.map(ext => `.${ext}`).filter(ext => useTypeScript || !ext.includes('ts')),
    alias: {
      // Allows for better profiling with ReactDevTools
      ...(isEnvProductionProfile && {
        'react-dom$': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      }),
      ...(aliases.webpackAliases || {}),
    },
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc, [
        paths.appPackageJson,
        require.resolve('react-refresh/runtime'),
        require.resolve('@pmmmwh/react-refresh-webpack-plugin'),
        babelRuntimeEntry,
        babelRuntimeEntryHelpers,
        babelRuntimeRegenerator,
      ]),
    ],
  };
};
