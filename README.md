# dsh-wallpaper

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）
Web 客户端做的壁纸插件。它把一张图片或一段循环视频铺在整个应用背后——相当于
Wallpaper Engine 对桌面所做的事，只不过发生在应用内部——并提供本地壁纸库、播放
列表，以及压暗 / 模糊 / 透明度调节。

## 功能

- **图片与视频壁纸。** 视频静音循环播放——**没有播放开关**。开关被整个去掉了，因为
  这里没有第二个决定可做：`off` 已经是「不放壁纸」，屏幕上还留着一段视频，就说明用户
  要看它动。`playing` 只作为历史设置保留。
- **本地壁纸库。** 从磁盘选择图片和视频，字节存进浏览器的 **IndexedDB**（对象仓库
  `dsh-wallpaper/media`），设置项本身只存标量。不需要任何服务端或文件系统访问，
  重启后依然在。导入按**内容指纹**去重，同一张壁纸不会因为改了名字或重复点 Gallery
  而进库两次。
- **播放列表。** 按间隔轮播壁纸库，支持 `one` / `all` / `off` 三种重复模式，
  也可手动指定某一张。**`off` 就是暂停**——不是暂停视频，而是把壁纸层整个卸掉：
  插件不渲染壁纸，也不给外壳打 `data-wp-active`，应用恢复自己的原生背景，屏幕上不剩
  任何东西。
- **压暗、模糊、透明度。** 默认值经过调校，保证任何壁纸之上对话文字都可读。
- **玻璃模糊可调，默认 20px。** 侧栏、弹窗、标题栏、轨迹控件条、轨迹轮次列表和轨迹
  详情抽屉的 `backdrop-filter` 半径由 `Glass blur` 控制，默认 `20`——理由见下文
  "玻璃模糊"。
- **跟随主题。** 所有颜色都用语义化的 `--dsw-*` token，插件自身不监听主题变化，
  自动适配 dsh 的明暗配色；圆角取自 `--dsw-radius-*` 共享档位，不引入局部数值。

## 安装

插件是一个**组合包（bundle）**，`package.json` 里的 `dsh.bundle.patch` 指向
`cordis.patch.yml`，由 `dsh plugin` 装进 profile：

```
dsh plugin --profile desktop add D:/dsh-official/plugins/dsh-wallpaper
```

不装进 profile、只想临时挂上时，仍然可以用 home 级补丁层（插件目录里两个脚本做
的就是这件事）：

```
dsh-wallpaper\remount.cmd
```

两条路**不要同时用**——插件行会挂载两次，控制按钮出现两个。`cordis.patch.yml` 里
的插件行按**包名**而不是路径引用，正是为了让 pnpm 装出来的副本能被 Node 解析到；
home 补丁层则按绝对路径引用自己这份 checkout。

然后启动 dsh。界面右下角会出现壁纸控制按钮，点开面板即可添加壁纸。

## 卸载

```
dsh plugin --profile desktop remove dsh-wallpaper   # 组合包安装
dsh-wallpaper\unmount.cmd                           # home 补丁层
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
background:        var(--dsw-menu-surface-fill, var(--dsw-specific-menu))
backdrop-filter:   var(--dsw-menu-backdrop-filter)   /* blur(40px) saturate(150%) */
```

必须走 token，不能写死色值——同一个 token 在两个主题下差别很大：

| token | 浅色 | 深色 |
| --- | --- | --- |
| `--dsw-specific-menu` | `rgba(248,249,250,0.58)` 亮白半透 | `rgba(67,69,74,0.45)` 暗灰半透 |
| `--dsw-alias-bg-document-preview` | `#ebeef2` | `#151517`（等于底色，一片黑） |

浮层（面板、悬浮按钮、弹窗）一律 `border: 0` + 单一 elevation 投影——主题的
elevation 投影本身已经带了那根 0.5px 发丝描边，再叠一层 `--dsw-alias-border-*`
中性边框正是 ui-theme 的 elevation spec 会拒绝的那种组合。圆角走共享档位：
紧凑控件 R8、标准输入 R12、悬浮面板 R28，面板 8px 内缩到内层表面 R20（同心内缩，
内层 = 外层 − 内缩距离），计数徽章是刻意的胶囊，`999px` 必须与
`corner-shape: round` 成对出现。右侧栏**不带**投影，因为它是通高的停靠栏，不是浮层
卡片，它自己的左边框保留原样。

侧栏、弹窗、标题栏上那层玻璃的模糊半径单独由 `--wpq-glass-filter` 提供，默认
`blur(20px) saturate(1.35)`。把面板里的 `Glass blur` 填成 `0`，这个变量会换成外壳自己的
`--dsw-menu-backdrop-filter`（`blur(40px) saturate(150%)`）——注意 `0` 是"用外壳那一档"，
不是"关掉玻璃"，这两件事不一样。

## 轨迹视图

轨迹视图是唯一一处"自带一整套外壳"的视图：它不共享对话视图的容器，而是自己刷底色。
之前那条 `[data-slot="main.conversation"]>*` 够不到它，因为轨迹的表面是
`main.conversation` 的**孙**节点，不是子节点。

整个视图挂在一个**槽位契约**下面，这是稳定接缝，不是构建哈希：

```
conversation.view
└─ <view root>            视图容器本身
   ├─ <toolbar>           时长 / 轮次 / 调用 过滤行和搜索框
   ├─ <plot section>      └─ <plot>   token 计量条
   └─ <ledger>            轮次列表
      └─ <split>          └─ <table pane> └─ <table>
```

内层用**语义类名后缀**匹配（`_ledger` / `_split` / `_tablePane`）加一个 `table` 元素
选择器，和右侧栏用 `_pane` 是同一个思路：构建换了 CSS-module 哈希也不会失效。

轨迹里要分两类处理，混在一起就会出问题：

| 部分 | 处理 | 原因 |
| --- | --- | --- |
| 视图容器、`_split`、`_tablePane`、`table` | 完全透明 | 自己不刷底色，让下面一层透上来 |
| 工具栏、计量区（视图根的直接子 `_root`） | 毛玻璃表面 | 32px / 50px 的控件条，没有底衬就是两块浮在壁纸上的字 |
| `_ledger`（轮次列表） | 毛玻璃，底色比菜单更薄（34%） | 用户 / 助手 / 工具 / 子工具标签所在的那整块阅读区 |

第二类一开始也做成了全透明，结果就是"太透了没法用"——控件压在一张会动的图上，
读不清。给它们和侧栏同一份毛玻璃，问题就没了。

第三类走过一遍来回：`_ledger` 最初是全透明的，壁纸直接透上来，没有磨砂感，读起来像
贴在玻璃上的字；换成菜单那份 58% 底色，又塌回一块白板。菜单底色是给 288px 浮层调的，
用户本来就知道自己在看什么；轮次列表是整幅阅读区，同样的比例就压住了壁纸。最后用
`color-mix(in srgb, var(--dsw-alias-bg-base) 34%, transparent)`——薄到壁纸的颜色真的透得
出来，行文字的对比度又还在。玻璃只加在 `_ledger` 这一层最外圈的盒子上，里面的 `_split`
/ `_tablePane` / `table` 继续透明，让它透上来，而不是在同一片像素上叠四层
`backdrop-filter`。

**`加载更早的历史` 那一行故意不处理。** 外壳用不透明的 `--dsw-alias-bg-layer-1` 画那个
按钮，而且它撑满整行宽度——设计上就是要读成一个实心按钮浮在列表上。把它磨砂掉，用户
反而找不到那个唯一用来往前翻页的控件。

**不能再往下放宽：** token 计量条、搜索框和输入卡片在更深一层，它们各自的底色正是
让轨迹在任何壁纸上都还读得清的原因。实测过：把它们一起透明掉，计量条就失去了参照。

**计量条自己的标签列**（「输入 / 模型 / 工具」）用的是 `--dsw-alias-label-caption`，在外壳
自己的实底上是一句安静的说明；换成毛玻璃之后底色由壁纸决定，`#adb2b8` 落在浅色壁纸上
只有约 1.9:1，标签直接糊进表面。计量条是插件仅有的两处「把玻璃垫在外壳自己的文字下面」
的地方之一，所以也是这里唯一要把文字提一档的地方——提到 `--dsw-alias-label-secondary`，
仍然走 token，深色主题照常重映射。

**详情抽屉**（点某个 kind 标签弹出来的那块）是轨迹里的一个 `<aside>`，不是
`rightbar.session` 的 `_pane`，所以右栏那条规则一直够不到它：它是一块 379×623 的实心
白板，轨迹里剩下的最后一块大白。它现在和右栏用同一份毛玻璃，`isolation: auto` 一并给
上；选择器按标签 + 类名片段匹配，不会误伤 `_detailsHeader` / `_detailTabs`。

> 这套选择器是挂调试端口实测出来的，不是猜的。定位方法见下面"怎么自己查"。

## 怎么自己查

外壳的类名是构建期哈希，靠读代码猜不出来。桌面版起一个 CDP 端口就能看到真实 DOM：

```powershell
Stop-Process -Name "DeepSeek Harness" -Force
Start-Process "D:\dsh-official\DeepSeek Harness\DeepSeek Harness.exe" `
  -ArgumentList '--remote-debugging-port=9222'
```

然后 `GET http://127.0.0.1:9222/json/list` 拿到页面的 `webSocketDebuggerUrl`，用
`Runtime.evaluate` 跑两段：

```js
// 1. 切到出问题的视图
[...document.querySelectorAll('button,[role="tab"],a,div')]
  .find(n => (n.textContent||'').trim() === '轨迹' && n.getBoundingClientRect().width > 0)
  .click();

// 2. 列出所有还在刷底色的大块元素，带类名和位置
[...document.querySelectorAll('body *')].filter(el => {
  const r = el.getBoundingClientRect();
  return r.width > 300 && r.height > 30
    && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
}).map(el => `${el.tagName}.${el.className} ${getComputedStyle(el).backgroundColor}`);
```

**候选规则可以直接注入正在运行的页面验证**，不用改一行代码就能看到效果：

```js
const tag = document.createElement('style');
tag.id = 'probe-test';
tag.textContent = '你的候选规则';
document.head.appendChild(tag);
```

满意之后再写进 bundle，替换掉那张一次性的 `<style>`。这个循环比"改代码—重启—看效果"
快得多。查完记得把应用正常重启一次（不带调试端口），bundle 是启动时快照。

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
git checkout <sha> -- lib/client.js # 或者只把某个文件拿回来
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

## 存储

壁纸字节存在 IndexedDB 的 `dsh-wallpaper/media` 对象仓库里，`localStorage` 只留
一份很小的设置文档（`dsh-wallpaper:settings`），里面是标量加一个纯元数据的壁纸库
列表。

**不要把媒体内联进设置文档。** 旧版本用 base64 data URL 存，一个 25 MB 的视频就
变成 33 MB 的字符串，而 `localStorage` 没有增量写：改一次亮度就把整份文档重写一遍，
背后的 leveldb 于是每次都多出一份完整副本。实测两个 33.7 MB 的 `.ldb` 就是这么来的。

从旧版本升级时不需要手动处理：首次挂载会检测到条目里还带着内联字节，把它们搬进
IndexedDB，然后重写设置文档把那段字符串彻底删掉；读不回来的条目直接丢弃，不会留
一行永远坏死的记录。`--dump-config` 或应用数据目录里的 `Local Storage\leveldb` 可以
用来确认搬迁是否完成。

搬迁是**异步**的（一个 25 MB 的视频要走一次 fetch + 一次 IndexedDB 写入），所以它
必须以"变换"的形式交给调用方，由调用方套在**当下**的设置上再落盘。这里曾经埋过一个
很典型的坑：迁移函数拿着挂载那一刻的快照重建整个设置对象，既没有写回 localStorage，
又会把搬迁期间新加的壁纸整个覆盖掉——表现就是"加了壁纸，重启后没了"。现在两处都改
成函数式更新 + 落盘，迁移期间加的东西原样保留，搬迁也只做一次。

冷启动还会做一次自检：把列表和实际存着的字节对一遍，没有字节的条目从列表里剔除，
并把 `index` 收回合法范围。少了这一步，一行指向空文件的记录会渲染成一片空白层，和
"壁纸整个没挂上"在界面上完全没法区分。

## 图库

仓库里的 `wallpapers/manifest.json` 列出随插件分发的壁纸，面板上「Gallery →
Import…」会把它拉下来，走**和手动选文件完全相同**的入库路径（同样进 IndexedDB），
所以只有一条存储路径、一种失败模式。条目里的 `url` 相对于 manifest 解析，图库目录
整个搬家不用改清单。

图库地址是**设置**而不是常量（`gallery` 字段）：别的部署把自己的 manifest 指过来
就行，不用改 bundle。默认指向本仓库的 raw 地址。

重复点 Import 不会再下一遍。manifest 里只有名字和大小，所以入库前有两道闸：名字 +
大小在**下载之前**就比对——真正省带宽的是这一道，二十几 MB 的视频不该为了发现「已经
有了」再下一遍；内容指纹在下载**之后**比对，同一段字节换个名字也认得出来。全都在库里
的时候面板会直说，而不是假装导入了什么。

> 仓库因此多了约 44 MB —— mp4 已经是压缩格式，git 不会再压一遍。GitHub 单文件 50 MB
> 会告警、100 MB 会硬拒，这两个都还在安全线内。

## 玻璃模糊（Glass blur）

面板上那个 **Glass blur (px)** 控制的是 `backdrop-filter: blur()` 的半径，作用在
**侧栏、弹窗、Windows 标题栏、轨迹的控件条、轨迹的轮次列表和轨迹的详情抽屉**
这几块表面上。效果就是毛玻璃：壁纸的颜色透上来，但被糊开，所以底下的画面不会和
上面的文字抢注意力。

底色不提供调节。侧栏、弹窗、标题栏、控件条走外壳自己的 `--dsw-menu-surface-fill`；
只有轨迹的轮次列表用更薄的一份（34%，见"轨迹视图"），因为它是一整块阅读区。两份底色都
从 `--dsw-alias-bg-base` 混出来，明暗主题各自成立。

| 模糊 | 观感 | 代价 |
| --- | --- | --- |
| 0 | 用外壳自己的 `blur(40px) saturate(150%)` | 不是"关掉"，是换成一档更大的 |
| 20（默认） | 明显的磨砂，壁纸轮廓化开 | 中等；本机能稳定跑满 |
| 24（上限） | 更强的虚化 | 大半径 backdrop-filter 是合成器压力最大的一项 |

**为什么默认 20 而不是外壳那一档 40。** 40px 是给 288px 浮层调的；这个插件磨的是好几块
**通高**面板压在视频上。实测在本机（AMD 780M，2023-08 的驱动）上，侧栏、标题栏、右侧栏
再加上轨迹的轮次列表一起上 40px，合成器直接停摆——`Page.captureScreenshot` 一直拿不到
帧，应用被迫重启。降到 20px 之后同样的画面稳定，而磨砂感还在。

12px 也试过，问题不在性能而在观感：12px 配菜单那份 58% 底色，亮色壁纸上看起来仍然是一
块白板，因为底子太厚，模糊的层次根本显不出来。要读出磨砂，底色薄比模糊大更要紧——
这也是轮次列表最后定在 34% 的原因。

### 一个值得记住的坑

滤镜值必须整体交给变量，样式表里不能这么写：

```css
/* 错的：展开成裸的 20px，而 20px 不是滤镜函数 */
backdrop-filter: var(--wpq-glass-filter) saturate(1.35);
/* 同样错：none 不能和其他函数并列 */
backdrop-filter: var(--wpq-glass-filter) saturate(1.35);   /* --wpq-glass-filter: none */
```

两种情况都会在解析期被整条丢弃——**不报错、不警告，只是永远不生效**，而旁边那条
`!important` 的 background 照常生效，看上去就像"底色在、模糊不在"。所以变量持有的是
**完整的滤镜函数列表**（`blur(20px) saturate(1.35)`，或者 0 时的
`var(--dsw-menu-backdrop-filter)`），由 JS 拼好再写进去。

`none` 和 `blur(0px)` 也要分清：前者不产生滤镜图层，后者仍然要建一层，白付合成器
开销。

### 另一个坑：`isolation` 会让毛玻璃变成假的

外壳给轨迹的计量区和轮次列表都加了 `isolation: isolate`。这会形成 backdrop root，把
`backdrop-filter` 的采样范围截断在元素自己的边界内——而那里面除了半透明的 `_plot` 和
数据条什么都没有。结果就是：**模糊照样显示，底色也在，但背后是空的**，看上去就是一块
58% 的白板，跟没加毛玻璃一样。

侧栏没有这个问题（`isolation: auto`），所以侧栏一直是真玻璃。

修法是给这几块表面加 `isolation: auto`，让采样能一路走到壁纸层。改完计量区才真的透出
壁纸。

## 为什么会卡，以及为什么默认这么保守

渲染进程崩溃过一次，11 次 crash 日志里没有任何 JS 错误——那种"崩"不是脚本抛异常，
是进程被从底下掀掉。触发条件是三件事叠在一起：

1. 全屏 `<video>` 走硬件解码；
2. 侧栏 / 弹窗 / 标题栏同时挂上全高的大半径 `backdrop-filter`；
3. 显卡驱动很旧（本机 AMD 780M，驱动日期 2023-08）。

三样都开着的时候合成器压力足够把 renderer 带走，dsh 随即重启，再崩，于是变成
崩溃-重启死循环。所以现在：

- 玻璃模糊默认 20px，上限 24。**不要把它设成 0**——`0` 不是"关掉"，是换成外壳那一档
  `blur(40px) saturate(150%)`，比默认值更贵。曾经的 42px 就是这么来的；
- 轨迹的轮次列表虽然也上了玻璃，但玻璃只加在最外圈一层盒子，内部的
  `_split` / `_tablePane` / `table` 全部保持透明，避免同一片像素上叠多层滤镜图层；
- 视频随壁纸一起播放——`off` 时整个壁纸层都不挂载，也就没有解码；
- 开启"减少动态效果"时视频强制暂停；
- 窗口不可见时暂停解码，回到前台再续上。

真要根治，把显卡驱动更新掉比在插件里做任何取舍都管用。

## 已知限制

- 壁纸库跟着浏览器的 IndexedDB 走，不跨设备同步；清浏览器数据会连同壁纸一起清掉。
  要做成 Wallpaper Engine 那种海量本地库、需要跨会话共享，得走宿主侧读文件系统的
  能力。
- 一个窗口只对应一张壁纸。单窗口的客户端里，"每显示器不同壁纸"没有意义。
- 没有屏保模式——那属于操作系统层面的事，在应用之外。
