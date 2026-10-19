// ============================================================
// Clash Verge Rev 全局扩展脚本（自建节点优先版）
//
// - 名称以“🏠”开头的节点视为自建节点（在订阅的“编辑节点”中添加，不写入本脚本）。
// - 有自建节点时：AI 默认走“🏠 自建”，没有时默认“🇺🇸 美国”；其余国外流量跟随“🚀 节点选择”。
// - 机场节点按地区分组，仅作手动备用；不使用自动测速或故障转移，避免出口 IP 自动变化。
// - 局域网、国内、支付宝/阿里风控类流量直连。
// - 补充的 AI / 直连域名放在本仓库的 ai.list、direct.list，作为远程规则集自动更新；
//   只改域名时不必重新分发本脚本。
// ============================================================

function main(config) {
  const PROXY = "🚀 节点选择";
  const SELF = "🏠 自建";
  const AI = "🤖 AI";
  const MEDIA = "📺 流媒体";
  const OTHER = "🌐 其他";

  const regions = [
    {
      name: "🇺🇸 美国",
      filter: "🇺🇸|美国|美國|洛杉矶|洛杉磯|硅谷|西雅图|西雅圖|纽约|紐約|united states|america|los angeles|san jose|seattle|new york|\\bus\\b|\\busa\\b",
    },
    { name: "🇭🇰 香港", filter: "🇭🇰|香港|hong kong|hongkong|\\bhk\\b|\\bhkg\\b" },
    { name: "🇯🇵 日本", filter: "🇯🇵|日本|东京|東京|大阪|川日|japan|tokyo|osaka|\\bjp\\b|\\bjpn\\b" },
    { name: "🇸🇬 新加坡", filter: "🇸🇬|新加坡|狮城|獅城|singapore|\\bsg\\b|\\bsgp\\b" },
  ];
  const regionNames = regions.map((region) => region.name);

  // 自建节点和订阅里的流量、到期提示项不进入机场分组。
  const notAirport = "🏠|剩余|流量|到期|过期|重置|traffic|expire|reset|\\d\\s*[GT]B\\b";

  const selfNodes = (config.proxies || [])
    .map((proxy) => String(proxy.name || ""))
    .filter((name) => name.startsWith("🏠"));
  const self = selfNodes.length > 0 ? [SELF] : [];
  const airport = [...regionNames, OTHER];

  config["proxy-groups"] = [
    { name: PROXY, type: "select", proxies: [...self, ...airport, "DIRECT"] },
    ...(self.length > 0 ? [{ name: SELF, type: "select", proxies: selfNodes }] : []),
    // 默认第一项：有自建节点时为“🏠 自建”，否则为“🇺🇸 美国”。
    { name: AI, type: "select", proxies: [...self, ...airport] },
    { name: MEDIA, type: "select", proxies: [PROXY, ...self, ...airport, "DIRECT"] },
    ...regions.map((region) => ({
      name: region.name,
      type: "select",
      "include-all": true,
      filter: `(?i)${region.filter}`,
      "exclude-filter": `(?i)${notAirport}`,
    })),
    {
      name: OTHER,
      type: "select",
      "include-all": true,
      "exclude-filter": `(?i)${notAirport}|${regions.map((region) => region.filter).join("|")}`,
    },
  ];

  // 顺序即匹配顺序。GitHub、Microsoft、PayPal 在国内也有可直连的域名，
  // 须排在 ChinaMax 之前；宽泛的 ChinaMax 放最后，避免覆盖前面已识别的服务。
  const ruleSets = [
    ["Lan", "Lan_No_Resolve.yaml", "DIRECT"],
    ["Alibaba", "Alibaba_No_Resolve.yaml", "DIRECT"],
    ["OpenAI", "OpenAI_No_Resolve.yaml", AI],
    ["Claude", "Claude_No_Resolve.yaml", AI],
    ["Gemini", "Gemini_No_Resolve.yaml", AI],
    ["Google", "Google_No_Resolve.yaml", AI],
    ["GitHub", "GitHub_No_Resolve.yaml", PROXY],
    ["Microsoft", "Microsoft_No_Resolve.yaml", PROXY],
    ["PayPal", "PayPal_No_Resolve.yaml", PROXY],
    // iCloud、App Store 走国内 CDN。
    ["Apple", "Apple_Classical_No_Resolve.yaml", "DIRECT"],
    ["GlobalMedia", "GlobalMedia_Classical_No_Resolve.yaml", MEDIA],
    ["ChinaMax", "ChinaMax_Classical_No_Resolve.yaml", "DIRECT"],
  ];

  // 本仓库维护的补充域名，与 shadowrocket.conf 共用；排在上面的远程规则集之前匹配。
  const customRuleSets = [
    ["Custom_Direct", "direct.list", "DIRECT"],
    ["Custom_AI", "ai.list", AI],
  ];

  config["rule-providers"] = Object.fromEntries([
    ...customRuleSets.map(([name, file]) => [
      name,
      {
        type: "http",
        behavior: "classical",
        format: "text",
        url: `https://raw.githubusercontent.com/guge2/proxy-rules/main/${file}`,
        interval: 3600,
        path: `./ruleset/custom_${file}`,
      },
    ]),
    ...ruleSets.map(([name, file]) => [
      name,
      {
        type: "http",
        behavior: "classical",
        url: `https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/${name}/${file}`,
        interval: 86400,
        path: `./ruleset/${file}`,
      },
    ]),
  ]);

  const privateDirectRules = [
    "DOMAIN,localhost,DIRECT",
    "DOMAIN-SUFFIX,local,DIRECT",
    "DOMAIN-SUFFIX,lan,DIRECT",
    "DOMAIN-SUFFIX,home.arpa,DIRECT",
    "DOMAIN-SUFFIX,ts.net,DIRECT",
    "IP-CIDR,0.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
    "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
    "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,224.0.0.0/4,DIRECT,no-resolve",
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
    "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
  ];

  config.rules = [
    ...privateDirectRules,
    // 对进入 Clash 的流量保留局域网 IPv6，拒绝公网 IPv6；TUN 关闭时不约束直连流量。
    "IP-CIDR6,::/0,REJECT,no-resolve",
    ...[...customRuleSets, ...ruleSets].map(([name, , target]) => `RULE-SET,${name},${target}`),
    "GEOSITE,cn,DIRECT",
    "GEOIP,CN,DIRECT,no-resolve",
    `MATCH,${PROXY}`,
  ];

  config.profile = {
    ...(config.profile || {}),
    "store-selected": true,
    "store-fake-ip": true,
  };

  // 订阅自带 DNS 时沿用订阅的设置，只补齐解析代理服务器域名用的 DNS。
  // Clash Verge 会预先写入 use-system-hosts 等字段，故以是否有 nameserver 判断订阅是否自带 DNS。
  const plainDns = ["system", "223.5.5.5", "119.29.29.29"];
  const subscriptionDns = config.dns || {};
  config.dns =
    subscriptionDns.nameserver?.length > 0
      ? {
        ...subscriptionDns,
        "proxy-server-nameserver": subscriptionDns["proxy-server-nameserver"]?.length
          ? subscriptionDns["proxy-server-nameserver"]
          : plainDns,
      }
      : {
        enable: true,
        "cache-algorithm": "arc",
        "use-hosts": true,
        "use-system-hosts": true,
        "default-nameserver": plainDns,
        nameserver: ["system", "https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"],
        "proxy-server-nameserver": plainDns,
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "fake-ip-filter": [
          "*.lan",
          "*.local",
          "*.arpa",
          "*.home.arpa",
          "*.ts.net",
          "time.*.com",
          "ntp.*.com",
          "+.market.xiaomi.com",
          "localhost.ptlogin2.qq.com",
          "*.msftncsi.com",
          "www.msftconnecttest.com",
          "captive.apple.com",
        ],
      };
  // DNS 不返回 AAAA；公网 IPv6 拒绝规则仅作用于进入 Clash 的流量。
  config.dns.ipv6 = false;

  config["tcp-concurrent"] = true;
  config["geodata-mode"] = true;
  config["geo-auto-update"] = true;
  config["geo-update-interval"] = 24;
  config["etag-support"] = true;
  // 顶层 IPv6、TUN 开关和自动路由由 Clash Verge 界面管理；这里只保留 TUN 的 IPv6 地址和路由。
  config.tun = {
    ...(config.tun || {}),
    "inet6-address": ["fdfe:dcba:9876::1/126"],
    "inet6-route-address": ["::/1", "8000::/1"],
  };

  return config;
}
