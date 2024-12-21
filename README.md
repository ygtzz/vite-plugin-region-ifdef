<h2 align='center'>vite-plugin-region-ifdef</h2>

<p align="center">一个用于 Vite 的插件，实现类似 C/C++ 条件编译的功能。</p>

## 为什么选择条件编译

- 大量写 if else，会造成代码执行性能低下和管理混乱。
- 解决 SaaS 端定制化需求，编译到不同的工程，可以减少代码体积，编译到不同的工程后二次修改，会让后续升级变得很麻烦。
- 跨平台项目，Windows 桌面端、Web 端、移动端、小程序端等，部分模块及 API 差异化需求。
- 版本维护，在多版本迭代开发中需要在代码中做兼容处理，可以根据版本号进行条件编译，以及更多自定义条件编译。

## 使用方法

### 一. 安装依赖
```bash
npm install vite-plugin-region-ifdef --save-dev
```

### 二. 在 vite.config.js 中引入插件
```js
import { defineConfig } from 'vite'
import regionIfdef from 'vite-plugin-region-ifdef'
export default defineConfig({
    plugins: [
        regionIfdef({
            //include: '正则表达式', // 匹配文件
            //exclude: '正则表达式', // 排除文件
            condition: true,
            condition2: false,
            version: 1.2
        })
    ]
})
```

### 三. 配置条件编译变量

1. 在 vite.config.js 配置中配置条件编译变量
```js
export default defineConfig({
    plugins: [
        regionIfdef({
            // 可随意添加条件编译中使用的变量
            condition: true,
            condition2: false,
            version: 1.2
        })
    ]
})
```

2. 在项目中的 .env .env.local 等配置文件中添加条件编译变量
```bash
# .env.development
condition=true
condition2=false
version=1.2
```

### 四. 在代码中添加条件编译

- `#ifdef`：if defined 条件成立 输出代码
- `#ifndef`：if not defined 条件不成立 输出代码
- `#endif`：结束条件编译

支持多个条件编译，支持嵌套条件编译，支持条件表达式，支持条件运算。

1. 支持 `#region` 折叠
```html
<!-- #region ifdef condition -->
    <div>condition 条件成立</div>
    <!-- #region ifdef version>=1.2 -->
        <div>版本大于等于 1.2</div>
    <!-- #endregion endif  -->
    <!-- #region ifdef version<1.2 -->
        <div>版本小于 1.2</div>
    <!-- #endregion endif  -->
<!-- #endregion endif -->

<!-- #region ifndef condition2 -->
    <div>condition2 不成立时候输出</div>
<!-- #endregion endif -->

<!-- #region ifdef condition2&&version<1.2 -->
    <div>condition2 成立并且版本小于 1.2</div>
<!-- #endregion endif -->
```

2. 不使用折叠
```html
<!-- #ifdef condition -->
    <div>condition 条件成立</div>
    <!-- #ifdef version>=1.2 -->
        <div>版本大于等于 1.2</div>
    <!-- #endif  -->
    <!-- #ifdef version<1.2 -->
        <div>版本小于 1.2</div>
    <!-- #endif  -->
<!-- #endif -->

<!-- #ifdef condition2&&version<1.2 -->
    <div>condition2 成立并且版本小于 1.2</div>
<!-- #endif -->
```

3. 在 JS 代码中条件编译
```js
// #ifdef condition
console.log('condition 条件成立')
// #endif

// #ifdef version>=1.2
console.log('版本大于等于 1.2')
// #endif
```

4. 在 CSS 代码中条件编译
```css
/* #ifdef condition */
.condition {
    color: red;
}
/* #endif */
/* #ifdef version>=1.2 */
.version {
    color: blue;
}
/* #endif */
```



