module.exports = {
  ...require('@hyperlocal/config/eslint'),
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
