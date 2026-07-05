<div align="center">

# Cossmos · 服务状态监测器

一个使用 **[COSS UI](https://coss.com/ui)** 构建前端、**Go** 编写后端的轻量级服务状态监测器。
界面美观、功能丰富、内存占用低,同时适配 **GitHub Pages(零服务器)** 与 **Docker 长期运行** 两种部署方式。

[![CI](https://github.com/NORMAL-EX/Cossmos/actions/workflows/ci.yml/badge.svg)](https://github.com/NORMAL-EX/Cossmos/actions/workflows/ci.yml)
[![Docker](https://github.com/NORMAL-EX/Cossmos/actions/workflows/docker.yml/badge.svg)](https://github.com/NORMAL-EX/Cossmos/actions/workflows/docker.yml)
[![Demo](https://github.com/NORMAL-EX/Cossmos/actions/workflows/pages.yml/badge.svg)](https://github.com/NORMAL-EX/Cossmos/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

**[🌐 在线演示 / Live Demo](https://normal-ex.github.io/Cossmos/)**

</div>

> [!TIP]
> 这是一个 **GitHub 模板仓库**。点右上角绿色的 **「Use this template」** 即可创建你自己的状态页 —— 只需改一个 `config.yaml`,开启 Pages,几分钟搞定,无需服务器。

---

## ✨ 特性

- 🎨 **COSS UI 设计体系** —— 基于 [Base UI](https://base-ui.com) + Tailwind CSS v4 的组件,全部按钮 outline 描边。
- 🌗 **深 / 浅 / 跟随系统** 三态主题切换(切换按钮 + 弹出菜单),🌍 **中英双语**。
- 📊 状态总览横幅、指标卡片、**最近 N 次检查历史柱状图**、可用率、响应时间、**TLS 证书有效期**。
- 🔎 搜索与筛选(全部 / 正常 / 异常)。
- 🔒 可一键隐藏前端面板与 `status.json` 中的服务 URL、域名、IP:端口。
- 🩺 多种探测:HTTP/HTTPS(状态码、关键字、慢响应降级)与 TCP 端口。
- 🐳 **两种运行模式,一套数据契约**:`serve`(持续运行 + API + 内嵌前端,单二进制)/ `once`(单次运行产出 `status.json`,不起服务器)。
- 📄 **备案号**(ICP + 公安)、🖼️ **可配置 Logo**、📱 **响应式**、🪶 **低内存**(纯 Go,静态二进制约 7 MB)。

## 🚀 快速开始(作为模板,推荐)

**三步,零服务器,发布到 GitHub Pages:**

1. 点本仓库右上角 **「Use this template」→ Create a new repository**,创建你自己的仓库。
2. 编辑 [`config.yaml`](config.yaml) —— 填上你的 **站点标题、备案号、Logo、服务列表**(这是你唯一要改的文件)。
3. 打开你仓库的 **Settings → Pages → Build and deployment → Source**,选 **GitHub Actions**。

完成!`Demo (GitHub Pages)` 工作流会定时(默认每 15 分钟)检查并发布,访问:
`https://<你的用户名>.github.io/<仓库名>/`

> 想立刻看到结果?去 **Actions** 页手动运行一次 `Demo (GitHub Pages)`。

## 🐳 其他部署方式

<details>
<summary><b>Docker(serve 持续模式)</b></summary>

```bash
# 用你自己的 config.yaml 运行预构建镜像
docker run -d --name cossmos --restart unless-stopped \
  -p 8080:8080 \
  -v "$PWD/config.yaml:/app/config.yaml:ro" \
  -v cossmos-data:/app/data \
  ghcr.io/normal-ex/cossmos:latest
# 打开 http://localhost:8080
```

或 `docker compose up -d`(见 [docker-compose.yml](docker-compose.yml))。镜像默认内置示例 `config.yaml`,挂载即可覆盖。
</details>

<details>
<summary><b>从源码构建</b></summary>

需要 Go ≥ 1.24 与 Node ≥ 20。

```bash
make build                                  # 构建前端 + 内嵌的 Go 二进制
./cossmos -mode serve -config config.yaml   # 持续运行(serve)
# 或单次运行(once,不起服务器):
./cossmos -mode once -config config.yaml -out web/dist
```

> 在 GitHub Actions 中(`GITHUB_ACTIONS=true`)未指定 `-mode` 会自动选择 `once`。
</details>

## ⚙️ 配置

只需编辑 [`config.yaml`](config.yaml)(完整字段见 [`config.example.yaml`](config.example.yaml)):

```yaml
site:
  title: "我的服务状态"
  description: "..."
  refreshInterval: 60
  hideTargets: true                         # 隐藏面板/status.json 中的 URL、域名、IP:端口
  logo: "https://your.site/logo.svg"      # 可选;logoDark 为深色模式变体
  icp: "京ICP备12345678号"                # 备案号(留空则不显示)
  policeIcp: "京公网安备 11010802000000号"

monitor:
  interval: 60        # serve 模式两轮检查间隔(秒)
  timeout: 12         # 每个检查超时(秒)
  historySize: 90     # 每个服务保留的历史点数

services:
  - name: "官网"
    type: http                            # http | tcp
    url: "https://example.com"
    expectStatus: [200, 301, 302]
    keyword: ""                           # 响应体须包含的关键字(可选)
    degradedMs: 1500                      # 慢于此毫秒数 => 降级
  - name: "数据库"
    type: tcp
    host: "db.example.com"
    port: 5432
```

### 环境变量(Docker / serve)

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `COSSMOS_MODE` | `serve` 或 `once` | serve(CI 中自动 once) |
| `COSSMOS_CONFIG` | 配置文件路径 | `config.yaml` |
| `COSSMOS_DATA` | 历史持久化文件 | `data/history.json` |
| `COSSMOS_LISTEN` | serve 监听地址 | `:8080` |

## 🔌 HTTP API(serve 模式)

| 端点 | 说明 |
| --- | --- |
| `GET /` | 内嵌的前端单页应用 |
| `GET /api/status`、`GET /status.json` | 当前状态快照(JSON) |
| `GET /api/healthz` | 健康检查 |

## 🧱 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 · Vite 7 · TypeScript · Tailwind CSS v4 · **COSS UI**(Base UI)· lucide-react |
| 后端 | Go 1.24(标准库 + `gopkg.in/yaml.v3`) |
| 容器 | 多阶段、多架构(amd64 / arm64)、Alpine 运行时 |
| CI/CD | GitHub Actions(CI · GHCR 镜像 · Pages 演示) |

## 📁 项目结构

```
.
├── config.yaml              # 你要编辑的配置(站点 + 服务)
├── config.example.yaml      # 完整字段参考
├── main.go                  # CLI 入口(serve / once)
├── internal/                # model / config / monitor / server
├── web/                     # COSS UI 前端(Vite + React),embed.go 内嵌产物
└── .github/workflows/       # ci · docker · pages
```

## 🛠️ 开发

```bash
cd web && npm install && npm run dev    # 前端热更新
go test ./... -race                     # 后端测试
make test                               # go test + 前端 typecheck
make lint                               # go vet + eslint
```

## 📝 备案号

页脚的 ICP / 公安备案号通过 `site.icp` / `site.policeIcp`(及对应链接)展示,留空则不显示。请填写你自己合法的备案信息。

## 🙏 致谢 / Acknowledgements

前端使用 **[COSS UI](https://coss.com/ui)**(基于 [Base UI](https://base-ui.com) 的开源 React 组件库,MIT)。详见 [ATTRIBUTION.md](ATTRIBUTION.md)。

## 📄 许可证

[MIT](LICENSE) © NORMAL-EX
