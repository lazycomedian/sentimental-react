module.exports = {
  DEFAULT_PORT: parseInt(process.env.PORT, 10) || 3000,
  HOST: process.env.HOST || '0.0.0.0',

  /** 监测是否存在jsx-runtime包 */
  hasJsxRuntime: (() => {
    if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') return false;

    try {
      require.resolve('react/jsx-runtime');
      return true;
    } catch (e) {
      return false;
    }
  })(),
};
