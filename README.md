# MV 渲染器（安卓 + PC）

代码 MV 播放器 / 渲染器：内置 P(doom)，其余合集从 Releases 按需下载离线播放。
支持**逐帧渲染输出为 MP4**（H.264 + AAC）、自适应降档、档位 HUD 等。

## 目录

| 路径 | 内容 |
|---|---|
| `web/` | App 内置网页（首页、播放器、注入脚本 `mv-export.js` / `mv-pre.js`、`mp4-muxer.js`） |
| `android/` | 安卓工程（AssetServer：本地 HTTP 服务 + 注入 + 渲染落盘） |
| `pc/` | PC 版（Electron：main.js / server.js / mv-dl.cjs） |
| `mv/<名字>/` | 11 支 MV 的工程源码（Canvas / WebGL 逐帧渲染，时间轴 + 场景代码） |
| `tools/` | 打包脚本（R2/合集包/APK 重打等） |

## 下载

最新发行版：<https://github.com/xunfe/mv-renderer/releases/latest>

- `MV-Renderer-1.4.2.apk` —— 安卓
- `MV-Renderer-PC-win64-1.4.2.zip` —— PC（Windows x64）
- 合集包：`ai.zip`（AI娘 6 支）、`science.zip`、`letters.zip`、`execute.zip`

> 国内直连 GitHub 可能较慢或中断，需要快速稳定下载请挂代理。

## 授权

见 `NOTICE.md`。**不含**单独购买的 world.execute (me) 原曲。
