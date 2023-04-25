// https://stylelint.io/
// https://stylelint.docschina.org/user-guide/rules/ 中文，注意版本是否和官网一致
module.exports = {
  extends: '@ric-universe/ric-stylelint-config',
  overrides: [
    {
      files: ['**/*.(scss|css|html|vue)'],
      customSyntax: 'postcss-scss'
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html'
    }
  ]
};
