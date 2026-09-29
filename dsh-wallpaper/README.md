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

- **壁纸层**通过 portal 挂到 frame 元素本身，并设 `z-index: -1`。这样它的绘制
  顺序排在 frame 自身背景之后、在 frame 的常规流子元素（侧边栏、中栏、右栏）
  之前——正是背景该有的位置。
- **控制按钮**仍留在 `shell.overlay` 槽位，那本来就是外壳放浮动控件的地方。

有两处表面带不透明的 `--dsw-alias-bg-base` 填充：frame 本身，以及填满中栏的
会话根容器。显示壁纸期间，只有这两处会变透明，由插件挂在 frame 上的
`data-wp-active` 属性统一控制，卸载时移除。其余样式一概不动，且壁纸层一卸载，
这条覆盖规则就立即失效。

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
