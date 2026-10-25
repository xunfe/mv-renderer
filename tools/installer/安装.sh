#!/usr/bin/env bash
# MV 合集插件 · 一键安装（DSH）
# 用法：bash 安装.sh [profile]      默认 profile: web（或环境变量 DSH_PROFILE）
set -euo pipefail
cd "$(dirname "$0")"

VERSION="__VERSION__"
PROFILE="${1:-${DSH_PROFILE:-web}}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"

say() { printf '%s\n' "$*"; }
die() { printf '\n❌ %s\n' "$*" >&2; exit 1; }

say "MV 合集插件 v$VERSION · 一键安装"
say ""

PKG="$(ls package/dsh-mv-hub-*.tgz 2>/dev/null | head -1 || true)"
[ -n "$PKG" ] && [ -f "$PKG" ] || die "安装包不完整：找不到 package/dsh-mv-hub-*.tgz（请解压后保持目录结构）"

command -v dsh >/dev/null 2>&1 || die "找不到 dsh 命令。请在 DSH 自带的终端里运行本脚本；或按《使用说明.md》用手动方式安装。"

PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
if [ ! -d "$PROFILE_DIR" ]; then
  say "没有找到 profile「$PROFILE」，$DSH_HOME/profiles 下现有："
  ls -1 "$DSH_HOME/profiles" 2>/dev/null || true
  die "换个 profile 名再试：bash 安装.sh <profile>"
fi
[ -f "$PROFILE_DIR/package.json" ] || die "profile 不完整（缺 package.json）：$PROFILE_DIR"

say "目标 profile：$PROFILE"
say "DSH 目录：$DSH_HOME"

# 把安装包留在 DSH 目录里，之后重装/升级不会因为删了解压目录而找不到文件
DEST="$DSH_HOME/mv-hub/packages"
mkdir -p "$DEST"
STABLE="$DEST/$(basename "$PKG")"
cp -f "$PKG" "$STABLE"

say "安装包：$STABLE"
say ""
say "正在安装（dsh plugin add）…"
dsh plugin --profile "$PROFILE" add "$STABLE"

say ""
say "✅ 安装完成。"
say ""
say "下一步："
say "  1. 完全退出 DSH，再重新打开（新插件、页面、模型说明都要重启后才加载）"
say "  2. 左侧栏点「MV 合集」"
say "  3. 模型会自动获得 mv-hub 技能：需要时才会读说明，平时不占上下文"
say ""
say "卸载：在 DSH 的插件管理器里移除 dsh-mv-hub，或执行："
say "  dsh plugin --profile $PROFILE remove dsh-mv-hub"
