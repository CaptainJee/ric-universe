# 项目进度

1、使用pnpm初始化主体项目；

2、创建项目结构：

```
  ｜- docs（文档目录）
  ｜- examples（案例目录）
  ｜- packages（子项目目录）
  ｜- scripts（脚本文件目录）
  ｜- .editorconfig（IDE基础配置文件）
  ｜- .eslintignore（代码校验过滤配置）
  ｜- .eslintrc.js（eslint校验配置文件）
  ｜- .npmrc（npm基础配置文件）
  ｜- .prettierignore（代码格式化过滤配置）
  ｜- .prettierrc（代码格式化配置文件）
  ｜- .gitignore （git提交过滤配置）
  ｜- .stylelintrc.js（样式规则校验配置文件）
  ｜- .stylelintignore（样式规则校验过滤配置）
  ｜- commitlint.config.js（git提交规则配置）
  ｜- package.json（）
  ｜- pnpm-workspace.yaml（）
  ｜- README.md（）
```

3、使用pnpm init 初始化子项目：

```
  ｜- ric-cli（通用打包相关脚本），
  ｜- ric-commitlint-config（git提交规范配置），
  ｜- ric-eslint-config（规范化eslint插件），
  ｜- ric-prettier-config（代码格式化规范化配置），
  ｜- ric-stylelint-config（规范化样式格式配置），
  ｜- ric-mobile-ui（移动端组件），
  ｜- ric-ui（pc端组件），
  ｜- ric-request（通用请求对象），
  ｜- ric-utils（常用JavaScript方法），
  ｜- ric-create-app（创建h5项目），
  ｜- ric-create-admin（创建控台子系统项目）；
```

3、修改子项目名称：_@ric-universe/xxx_;

4、主程序引入公共依赖:

ric-universe:

- commander
- inquirer
- chalk
- ora
- download-git-repo
- husky
- changeset
- commitizen
- conventional-changelog-conventionalcommits
- lint-staged

5、子项目引入依赖：

```
  ｜- ric-cli（）
  ｜- ric-commitlint-config（bumpp），
  ｜- ric-eslint-config（），
  ｜- ric-prettier-config（bumpp），
  ｜- ric-stylelint-config（bumpp），
  ｜- ric-mobile-ui（vue、babel、webpack），
  ｜- ric-ui（h_ui、vue、babel、webpack），
  ｜- ric-request（axios、），
  ｜- ric-utils（rollup），
  ｜- ric-create-app（），
  ｜- ric-create-admin（）；
```

6、子项目构建难度与完成进度：

- [x] ric-prettier-config（*）
- [x] ric-commitlint-config（*）
- [ ] ric-stylelint-config（*）
- [ ] ric-request（*）
- [ ] ric-utils（*）
- [ ] ric-create-app（**）
- [ ] ric-cli（***）
- [ ] ric-eslint-config（***）
- [ ] ric-mobile-ui（****）
- [ ] ric-ui（****）
- [ ] ric-create-admin（****）

7、git commit规范化方案

commitizen + conventional-changelog-cli + cz-conventional-changelog + husky + lint-staged + @commitlint/cli + @commitlint/config-conventional

8、eslint 校验方案

9、prettier 格式化方案

10、style 规范化方案
