# 版权、许可与素材出处

本仓库的**程序代码**（HTML / JS / CSS / Java / Node / Python）以 **AGPL-3.0** 授权，见 [LICENSE](LICENSE)。
下列第三方组件、字体、音频与影像素材**不因本仓库的 AGPL 授权而改变其原有版权与许可**，使用、再分发前请自行核对。

## 一、内置作品

| 作品 | 原作 / 来源 | 授权 |
|------|-------------|------|
| 世界还在写（原版） | B 站 **小伙伴ko**（UID 105330745） | 原作者授权本项目内置；源码、角色素材与音频不随开源仓库分发 |
| 世界还在写 · 墨海版（模仿版） | 画面重写：小黑；人物沿用 **小伙伴ko** 原版角色（未改动） | 模仿版代码 AGPL-3.0；角色素材与歌曲版权归原作者，不随仓库分发 |
| 数学简史 · 两万年 | B 站 **球球求真**（UID 7210010） | 原作者授权本项目复刻；音乐、影像与原始创意版权归原作者 |
| 化学简史 · 元素之歌 | B 站 **球球求真**（UID 7210010） | 同上（整合集授权） |
| 航天简史 | B 站 **球球求真**（UID 7210010） | 同上 |
| 地理简史 · 影子线 | B 站 **球球求真**（UID 7210010） | 同上 |
| 一封情书 · DeepSeek | 创意参考 B 站 **银铃仙兽大肥鱼**《vube知识大赏丨deepseek是写给中国的一封情书》 | BGM《开智小曲》使用已获授权；文案与画面为独立重写 |
| world.execute (me) 离线版 | B 站 **穆阿蒂布**（UID 272722241）/ [FrostNovaOrg/world-execute-web](https://github.com/FrostNovaOrg/world-execute-web) | 代码 **AGPL-3.0**；词曲与录音版权归 Mili 及原权利人 |
| DSH PV · world.execute (me)（PC 独有） | [MisakaZentai/world-execute-me-dsh-pv](https://github.com/MisakaZentai/world-execute-me-dsh-pv) | **MIT**（其 `LICENSES/` 另有 CC-BY-NC-SA-4.0 与 React-MIT） |
| I'm Upping My P(doom) 中文本地化 | [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video)（原项目 [Giacomo Magnanini]） | **MIT** |

## 二、音频

- `web/mv/*/audio.m4a`、`web/audio/pdoom.mp3` 等内置音轨来自上述原作，**仅在获得授权的范围内随作品使用**；AGPL-3.0 不覆盖这些音轨，也不要将它们单独再分发。
- **《世界还在写》原版音轨**（`web/mv/world/song/世界还在写.mp3`）由原作者提供并授权内置，**不随开源仓库分发**；墨海版通过同一路径读取。
- **`web/execute/song.flac` 不在仓库中**。它是仓库作者自行购买 Mili《world.execute (me) ;》单曲后放入本机离线版使用的，仅供个人欣赏，不得用于商业用途，也不应再分发或传播。想听请用首页「官方在线」入口，或自行放入合法拥有的音频。

## 三、第三方代码与字体

| 组件 | 位置 | 许可 |
|------|------|------|
| pdoom-video 构建产物 | `web/assets/`、`web/data/`、`web/plates*/`、`web/audio/pdoom.mp3` | MIT（上游仓库 LICENSE） |
| world.execute (me) web player | `web/execute/` | AGPL-3.0（`web/execute/LICENSE`、`NOTICE.md`） |
| XM Engine 演示 | `web/engine/` | 版权归 [xiaoming6680/xm-video-engine](https://github.com/xiaoming6680/xm-video-engine) 作者 |
| DSH PV 渲染工程 | `pc/dshpv/` | MIT + CC-BY-NC-SA-4.0 / React-MIT（见 `pc/dshpv/LICENSES/`） |
| Electron | PC 运行时 | MIT |
| Noto Sans SC / Noto Serif SC | `web/fonts/`、`web/mv/*/assets/` | SIL Open Font License 1.1 |
| Archivo / Cormorant Garamond / IBM Plex Mono | `web/fonts/` | SIL Open Font License 1.1（`web/fonts/src/OFL.txt`） |

## 四、影像与数据素材

- **化学简史**：31 张历史图片来自 Wikimedia Commons，逐张的作者、许可与来源页见
  `web/mv/chemistry/assets/credits.json`；元素数据取自 IUPAC/CIAAW 2021、NIST ASD、UniProt P01308。
- **航天简史**：实拍与官方图片来自 NASA、ESA、CNSA 等公开渠道，版权归各自机构；使用遵循其公开使用条款。
- **地理简史**：海陆轮廓来自 [Natural Earth](https://www.naturalearthdata.com/)（公有领域）。
- **一封情书**：表情贴纸来自 GitHub 项目
  [the-beating-light-of-the-nail/deepseek-chan-meme-pack](https://github.com/the-beating-light-of-the-nail/deepseek-chan-meme-pack)；
  DeepSeek 鲸鱼图标来自 [Simple Icons](https://simpleicons.org/)（图标集 CC0），商标归 DeepSeek 所有。

## 五、商标

「DeepSeek」「Mili」「Bilibili」等名称与标识归各自权利人所有。本项目为个人学习、非商业用途的粉丝作品，与上述公司/创作者无隶属关系。
