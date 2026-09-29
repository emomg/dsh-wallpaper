# dsh-wallpaper

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）
Web 客户端做的壁纸插件。它把一张图片或一段循环视频铺在整个应用背后——相当于
Wallpaper Engine 对桌面所做的事，只不过发生在应用内部——并提供本地壁纸库、播放
列表，以及压暗 / 模糊 / 透明度调节。

## 功能

- **图片与视频壁纸。** 视频静音循环播放；浏览器自动播放策略拒绝时会被静默吞掉，
  不会抛错。
- **本地壁纸库。** 从磁盘选择图片和视频，插件将其内联为 data URL 存入
  `localStorage`，无需任何服务端或文件系统访问，重启后依然在。
- **播放列表。** 按间隔轮播壁纸库，支持 `one` / `all` / `off` 三种重复模式，
  也可手动指定某一张。
- **压暗、模糊、透明度。** 默认值经过调校，保证任何壁纸之上对话文字都可读。
- **跟随主题。** 所有颜色都用语义化的 `--dsw-*` token，插件自身不监听主题变化，
  自动适配 dsh 的明暗配色。

## 安装

```
dsh-wallpaper\remount.cmd
```

然后启动 dsh。Web 界面右下角会出现壁纸控制按钮，点开面板即可添加壁纸。

## 卸载

```
dsh-wallpaper\unmount.cmd
```

脚本会先备份再删除，随时可以重新装回来。

## 挂载方式

插件通过 dsh 的 **home 级补丁层**挂载，也就是一个文件：

```
%USERPROFILE%\.dsh\cordis.patch.yml
```

```yaml
- insert:
    - id: wallpaper
      name: '<dsh-wallpaper/lib/index.js 的路径>'
```

这一行就是插件在 dsh 安装目录里的全部足迹。`.dsh\profiles\node_modules` 下 dsh
自身的包**完全不被修改**，所以 dsh 升级不会冲掉插件，插件也弄不坏升级。

浏览器半边通过包的 `./client` 导出交付，由 dsh 像分发任何其他客户端插件一样
提供，路径是 `/plugins/dsh-wallpaper/client.js`。

## 壁纸是怎么跑到界面底下的

外壳的 `root` 槽持有三栏布局，外加一个 `shell.overlay` 浮动层。浮动层本是浮动
控件的天然位置，但它带 `z-index: 20`，渲染在里面的任何东西都会盖在三栏之上、
把应用本身挡住。所以插件把两者拆开：

- **壁纸层**通过 portal 挂到 `document.body`，并设 `position: fixed; z-index: 0`；
  frame 自身被提到 `z-index: 1`。layer 挂在 body 而不是 frame 上，是因为 frame
  设了 `overflow: hidden`，挂进去会被裁到 frame 自己的盒子，底部总会留一条空白带。
- **控制按钮**仍留在 `shell.overlay` 槽位，那本来就是外壳放浮动控件的地方。

带不透明 `--dsw-alias-bg-base` 填充的表面，**Web 客户端和桌面版不一样**：

| 表面 | Web 客户端 | 桌面版（dsh ≥ 0.2.0） |
| --- | --- | --- |
| `frame` 自身 | 有 | 有 |
| `[data-slot="main.conversation"]` 的直接子元素 | 有 | 有 |
| `[class*="_centerCol"]` | 无 | **有** |
| `[data-slot="sidebar"]` 的直接子元素 | 无 | **有** |
| `frame::before`（Windows 标题栏） | 无 | **有** |
| 会话列表底部的 `span[class$="_fade"]` 渐变 | 无 | **有** |

设置面板和右侧栏不另发明配色，直接套外壳自己的**浮动菜单配方**，也就是「更多」弹
出来那个框用的那一套：

```
background:        var(--dsw-specific-menu)          /* 浅色 rgba(248,249,250,.58) */
backdrop-filter:   var(--dsw-menu-backdrop-filter)   /* blur(40px) saturate(150%) */
```

必须走 token，不能写死色值——同一个 token 在两个主题下差别很大：

| token | 浅色 | 深色 |
| --- | --- | --- |
| `--dsw-specific-menu` | `rgba(248,249,250,0.58)` 亮白半透 | `rgba(67,69,74,0.45)` 暗灰半透 |
| `--dsw-alias-bg-document-preview` | `#ebeef2` | `#151517`（等于底色，一片黑） |

弹窗额外带 `box-shadow: var(--dsw-elevation-panel)` 和 28px 圆角；右侧栏**不带**，
因为它是通高的停靠栏，不是浮层卡片，用卡片的描边和阴影会不对味，它自己的左边框保留
原样。

## 右侧栏那个选择器，标签是必需的

```
[data-slot="rightbar.session"] [class*="_pane"]           ← 错，命中 4 个
[data-slot="rightbar.session"] section[class*="_pane"]    ← 对，命中 1 个
```

**字符串 `_panel` 里含有 `_pane`。** 只写 `[class*="_pane"]` 会同时命中
`OUqwTW_panel`、`OUqwTW_panelBody`、`_paneBody_…` 和真正那个 `section._pane`——前三
个都是全透明的容器，规则落上去什么也没发生，唯独真正在涂色的那层一直没被碰到。这就是
之前反复改不对的原因，不是配色的问题。

右栏自上而下只有一层在涂色：

```
OUqwTW_panel          透明
└─ OUqwTW_panelBody   透明
   └─ _surface_…      透明
      └─ _tabLayout_… 透明
         └─ _tabCell_… 透明
            └─ section._tabHost_… _pane_…   ← 只有这层涂色（面板底 + 里面的卡片）
```

右侧栏在 frame 内，可以挂在 frame 的 `data-wp-active` 上；设置弹窗是 portal 到
`<body>` 的，够不着，所以插件同时在 `<html>` 上也挂了一份同样的标记。

## 别在 frame 动效期间动侧栏的模糊

曾经为了治"色框跟不上侧栏"，加过一条规则：`frame[data-animating]` /
`[data-dragging]` 时把侧栏的 `backdrop-filter` 关掉。**这是错的，已删除。**

`data-animating` 不只在侧栏自己收放时出现——**打开或关闭右侧栏同样会触发**（实测
约 200ms），而右侧栏一动，侧栏的毛玻璃就跟着闪一下变透明（模糊一关，22% 的淡底
压不住壁纸，看起来就是"透明了"）。一个只在特定交互下才出现、并且当时没能复现的
假设，不值得用一个到处都会触发的规则去换。

壁纸层是 `position: fixed` 铺满整个视口的，**没有裁剪**，但侧栏和右侧栏两块面板压在
它上面，真正能一眼看到的只剩中间一条带子——这是面板不透明度的结果，不是 bug。

最后一条不是填充色而是 `linear-gradient(transparent, #f9fafb)` 渐变，按背景色扫是
扫不到的，只有扫 `background-image` 才会现形。在玻璃侧栏上它就是压在壁纸上的
一条白杠。

桌面版给中栏刷了底色来承载标题栏下的左上圆角，侧栏自己的滚动根又会在玻璃层之上
再刷一遍底色，标题栏则是 frame 上的伪元素——三者都不是任何已有规则的子元素。只
处理前两处的话，壁纸仍会有约 74% 被中栏挡住。

显示壁纸期间，以上表面会变透明（标题栏改用与侧栏相同的玻璃），由插件挂在 frame
上的 `data-wp-active` 属性统一控制，卸载时移除。其余样式一概不动，且壁纸层一卸载，
这些覆盖规则就立即失效。侧栏那两条刻意用 `data-slot="sidebar"]>*` 和
`class$="_fade"` 而不是完整哈希类名（如 `_2H3hWW_root`、`_9lTDKa_fade`）——哈希每次
构建都会变，后缀不会。

## 插件够不到的地方

Windows 的最小化 / 最大化 / 关闭按钮不在网页里。它们是 Electron
`titleBarOverlay` 由系统绘制的约 138px 宽的实心色块，叠在网页内容之上，颜色取自
应用跟随的主题。页面 DOM 里那一带完全透明，所以任何 CSS 都碰不到它；截图里看到的
突兀白块就是它。能改变的只有应用自身的主题——切到深色模式时该色块会变深，与被压暗
的壁纸更接近。

## 改代码时的 git 工作流

这个仓库就是回滚机制。动手前先提交：

```
git status
git add -A
git commit -m "..."
```

改坏了要退回：

```
git log --oneline
git revert <sha>                    # 保留历史的撤销
git checkout <sha> -- dsh-wallpaper # 或者只把某个文件拿回来
```

改完 `lib/client.js` 后需要**重启 dsh**——对外提供的 bundle 是启动时快照的。
`--dump-config` 会打印组合后的完整配置树，是确认插件有没有挂上最快的办法：

```
node "%USERPROFILE%\.dsh\profiles\node_modules\@deepseek-ai\dsh\lib\bin.js" --profile web --dump-config
```

## 运行时注意事项

下面两条约束决定了浏览器半边该怎么写，都是实际调试踩出来的：

1. **Hooks 只能在 React 渲染过程中调用。** `apply(ctx)` 不在渲染过程里，所以
   所有状态都放在注册的 `WallpaperRoot` 组件中，而不是 `apply` 里。
2. **React 必须用运行时属性访问**（`react.useState`），绝不能在模块作用域解构
   ——模块图是惰性的，`require("react")` 在工厂函数被物化之前只会返回一个占位
   对象。

另外，`shell.overlay` 是 list 型槽位，注册时必须显式给出 `id`；它由 ui-layout
的 root 条目声明，所以注册要走 `ctx.slots.inject`，等那条声明先就位。

## 已知限制

- 壁纸以内联 data URL 形式存储，受 `localStorage` 容量限制（约 5 MB）。视频壁纸
  会比较快地撞到这个上限；要做成 Wallpaper Engine 那种海量本地库，需要宿主侧
  读文件系统的能力。
- 一个窗口只对应一张壁纸。单窗口的 Web 客户端里，"每显示器不同壁纸"没有意义。
- 没有屏保模式——那属于操作系统层面的事，在应用之外。
