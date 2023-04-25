@ric-universe/ric-commitlint-config
本包提供了《Git 规约》配套的 commitlint 可共享配置，用于对 git commit message 进行校验。

安装
除了本包，你需要同时安装 @commitlint/cli：

npm install @ric-universe/commitlint-config-win @commitlint/cli --save-dev
使用
在项目中的 commitlint.config.js 中继承本包:

module.exports = {
  extends: ['@ric-universe/commitlint-config-win'],
};
设置 git hook
可通过 husky 设置在 git commit 时触发 commitlint。

首先安装 husky：

npm install husky --save-dev
然后在 package.json 中增加：

{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
更多信息可参考 commitlint 文档
