# proxy-rules

家庭自用的 Clash Verge Rev 与小火箭分流规则。节点信息不在本仓库，自建节点名称须以 `🏠` 开头，在客户端里单独添加。

| 文件 | 用途 |
|---|---|
| `ai.list` | 走 `🤖 AI` 出口的补充域名（AI 服务及其验证码、支付，Siri / Apple 智能） |
| `direct.list` | 直连的补充域名（支付宝 / 阿里风控类、系统连通性检查） |
| `clash-verge-global-extend-script.js` | Clash Verge Rev 全局扩展脚本 |
| `shadowrocket.conf` | 小火箭配置 |

两个 `.list` 由两端共用，每行只写规则类型和值。只改域名时推送即可，客户端会自动拉取；改代理组或规则顺序时才需要重新导入脚本或配置。

## 首次导入

**Clash Verge Rev**：「订阅」页右键「全局扩展脚本」→ 编辑文件，用 [`clash-verge-global-extend-script.js`](https://raw.githubusercontent.com/guge2/proxy-rules/main/clash-verge-global-extend-script.js) 的内容替换全部内容并保存。

**小火箭**：「配置」页右上角 `+`，粘贴下面的地址并下载，然后点该配置选「使用配置」：

```
https://raw.githubusercontent.com/guge2/proxy-rules/main/shadowrocket.conf
```

## 更新

- Clash：每小时自动拉取 `.list`；想立即生效，到「规则」页的规则集合里更新 `Custom_AI`、`Custom_Direct`。
- 小火箭：「配置」页点该配置选「更新」，会重新下载配置和其中的规则集。
