"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sGet, sSet } from "../lib/storage";

/* ============================================================
   世界树 · 人类智慧晶体库
   骨架即网站：一棵可漫游的智慧之树。
   建言沉淀为晶体（共享数据），AI 负责寻路与提纯。
   ============================================================ */

/* ---------- 知识骨架（种子数据） ---------- */
const DOMAINS = [
  {
    id: "philosophy", name: "哲学", color: "#A78BFA",
    desc: "追问存在、知识与善的根本问题",
    children: [
      { id: "metaphysics", name: "形而上学", desc: "存在与实在的本质" },
      { id: "epistemology", name: "认识论", desc: "我们如何知道我们知道" },
      { id: "ethics", name: "伦理学", desc: "何为善，如何生活" },
      { id: "aesthetics", name: "美学", desc: "美与艺术经验的本质" },
    ],
  },
  {
    id: "science", name: "科学", color: "#67E8F9",
    desc: "以可证伪的方式理解自然",
    children: [
      { id: "physics", name: "物理学", desc: "物质、能量与时空的规律" },
      { id: "life", name: "生命科学", desc: "生命如何运作与演化" },
      { id: "math", name: "数学", desc: "抽象结构与必然真理" },
      { id: "cosmos", name: "宇宙学", desc: "宇宙的起源、结构与命运" },
    ],
  },
  {
    id: "tech", name: "技术", color: "#5EEAD4",
    desc: "改造世界的工具与方法",
    children: [
      { id: "ai", name: "人工智能", desc: "机器的学习、推理与创造" },
      { id: "energy", name: "能源", desc: "文明的动力来源与转型" },
      { id: "network", name: "信息与网络", desc: "计算、通信与数字社会" },
      { id: "bioeng", name: "生物工程", desc: "编辑与设计生命系统" },
    ],
  },
  {
    id: "humanities", name: "人文", color: "#F0ABFC",
    desc: "人类经验的记录与表达",
    children: [
      { id: "history", name: "历史", desc: "过去如何塑造现在" },
      { id: "literature", name: "语言与文学", desc: "以语词承载的经验" },
      { id: "art", name: "艺术", desc: "形式、情感与创造" },
      { id: "myth", name: "宗教与神话", desc: "意义系统与超越叙事" },
    ],
  },
  {
    id: "living", name: "生活", color: "#86EFAC",
    desc: "把智慧落进日常",
    children: [
      { id: "mind", name: "心智与情感", desc: "认识并照料自己的内在" },
      { id: "relations", name: "关系与社群", desc: "与他人共同生活" },
      { id: "health", name: "健康", desc: "身体与精神的可持续" },
      { id: "work", name: "财富与工作", desc: "资源、志业与自由" },
    ],
  },
];

/* 首次打开某节点时的示例建言（仅作演示种子） */
const SEED_INSIGHTS = {
  ethics: [
    { text: "把每个人当作目的本身，而不仅仅是手段。", author: "康德的回声", votes: 12 },
    { text: "在无法确定对错时，选择那个即使被公开也不羞愧的做法。", author: "无名旅人", votes: 7 },
  ],
  ai: [
    { text: "对齐问题的核心不是让 AI 听话，而是让它在我们无法监督时依然可靠。", author: "守林人", votes: 9 },
  ],
  mind: [
    { text: "情绪不是要解决的问题，而是要读取的信息。", author: "静水", votes: 11 },
  ],
};

/* ---------- 等级制度（来自设计稿） ---------- */
const LEVELS = [
  { wp: 0, name: "种子", sym: "·" },
  { wp: 100, name: "新芽", sym: "↟" },
  { wp: 500, name: "枝干", sym: "⌇" },
  { wp: 1500, name: "翠叶", sym: "❧" },
  { wp: 3000, name: "乔木", sym: "♠" },
  { wp: 8000, name: "智者林", sym: "☙" },
  { wp: 20000, name: "世界树", sym: "✦" },
];
function levelOf(wp) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (wp >= LEVELS[k].wp) i = k;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  const pct = next ? Math.min(100, Math.round(((wp - cur.wp) / (next.wp - cur.wp)) * 100)) : 100;
  return { idx: i, cur, next, pct };
}

/* ---------- 扁平节点表 + 径向布局 ---------- */
function buildLayout() {
  const nodes = [{ id: "root", name: "人类智慧", desc: "所有分支在此汇合", depth: 0, x: 0, y: 0, color: "#EDE9FE", parent: null, domain: null }];
  const links = [];
  const leafTotal = DOMAINS.reduce((s, d) => s + d.children.length, 0);
  let li = 0;
  const R1 = 128, R2 = 262;
  DOMAINS.forEach((d) => {
    const angles = d.children.map(() => {
      const a = (li / leafTotal) * Math.PI * 2 - Math.PI / 2;
      li++;
      return a;
    });
    const mid = Math.atan2(
      angles.reduce((s, a) => s + Math.sin(a), 0) / angles.length,
      angles.reduce((s, a) => s + Math.cos(a), 0) / angles.length
    );
    nodes.push({ id: d.id, name: d.name, desc: d.desc, depth: 1, x: Math.cos(mid) * R1, y: Math.sin(mid) * R1, color: d.color, parent: "root", domain: d.id, angle: mid });
    links.push(["root", d.id]);
    d.children.forEach((c, i) => {
      const a = angles[i];
      nodes.push({ id: c.id, name: c.name, desc: c.desc, depth: 2, x: Math.cos(a) * R2, y: Math.sin(a) * R2, color: d.color, parent: d.id, domain: d.id, angle: a });
      links.push([d.id, c.id]);
    });
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return { nodes, links, byId };
}
const LAYOUT = buildLayout();

/* ---------- Anthropic API（走服务端路由，key 不暴露给浏览器） ---------- */
async function askClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text || "";
}
function parseJSON(text) {
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch (e) { return null; }
}

/* ---------- 六边形晶体 ---------- */
function hexPoints(r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}

/* ============================================================ */
export default function App() {
  const [selected, setSelected] = useState(null);        // 当前节点 id
  const [profile, setProfile] = useState({ name: "", wp: 0, voted: [] });
  const [insights, setInsights] = useState([]);          // 当前节点建言
  const [crystal, setCrystal] = useState(null);          // 当前节点共识晶体
  const [loadingNode, setLoadingNode] = useState(false);
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const [pathResult, setPathResult] = useState(null);    // AI寻路结果
  const [pathLoading, setPathLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  /* 载入旅人档案 */
  useEffect(() => {
    (async () => {
      const p = await sGet("wt-profile");
      if (p) setProfile(p);
      setReady(true);
    })();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const gainWP = useCallback(async (amount, reason) => {
    setProfile((p) => {
      const np = { ...p, wp: p.wp + amount };
      sSet("wt-profile", np);
      return np;
    });
    showToast(`+${amount} WP · ${reason}`);
  }, [showToast]);

  /* 打开节点：加载建言与晶体 */
  const openNode = useCallback(async (id) => {
    setSelected(id);
    setPathResult(null);
    setLoadingNode(true);
    setCrystal(null);
    let list = await sGet(`wt-insights:${id}`, true);
    if (!list) {
      list = (SEED_INSIGHTS[id] || []).map((s, i) => ({
        id: `seed-${id}-${i}`, text: s.text, author: s.author, votes: s.votes, ts: Date.now(),
      }));
      if (list.length) await sSet(`wt-insights:${id}`, list, true);
    }
    setInsights(list.sort((a, b) => b.votes - a.votes));
    const c = await sGet(`wt-crystal:${id}`, true);
    setCrystal(c);
    setLoadingNode(false);
  }, []);

  /* 提交建言 */
  const submitInsight = async () => {
    const text = draft.trim();
    if (!text || !selected) return;
    const author = profile.name || nameDraft.trim() || "无名旅人";
    if (!profile.name) {
      const np = { ...profile, name: author };
      setProfile(np);
      await sSet("wt-profile", np);
    }
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, author, votes: 0, ts: Date.now() };
    const latest = (await sGet(`wt-insights:${selected}`, true)) || [];
    const merged = [item, ...latest];
    await sSet(`wt-insights:${selected}`, merged, true);
    setInsights(merged.sort((a, b) => b.votes - a.votes));
    setDraft("");
    gainWP(15, "建言已刻入晶体");
  };

  /* 点赞 */
  const vote = async (insightId) => {
    if (profile.voted.includes(insightId)) return;
    const latest = (await sGet(`wt-insights:${selected}`, true)) || insights;
    const merged = latest.map((it) => (it.id === insightId ? { ...it, votes: it.votes + 1 } : it));
    await sSet(`wt-insights:${selected}`, merged, true);
    setInsights(merged.sort((a, b) => b.votes - a.votes));
    const np = { ...profile, voted: [...profile.voted, insightId], wp: profile.wp + 2 };
    setProfile(np);
    await sSet("wt-profile", np);
    showToast("+2 WP · 你点亮了一条建言");
  };

  /* AI 寻路 */
  const findPath = async () => {
    const q = query.trim();
    if (!q || pathLoading) return;
    setPathLoading(true);
    setPathResult(null);
    const nodeList = LAYOUT.nodes.filter((n) => n.depth === 2).map((n) => `${n.id}｜${n.name}｜${n.desc}`).join("\n");
    const prompt = `你是"世界树"知识地图的寻路者。用户的问题是："${q}"

可用的知识节点（id｜名称｜简介）：
${nodeList}

请只返回 JSON（不要任何其他文字、不要 Markdown 代码块）：
{"answer": "一句话（40字内）指引，告诉用户该去哪些枝叶寻找答案", "nodes": ["最相关的1-3个节点id"]}`;
    try {
      const raw = await askClaude(prompt);
      const j = parseJSON(raw);
      if (j && Array.isArray(j.nodes)) {
        const valid = j.nodes.filter((id) => LAYOUT.byId[id]);
        setPathResult({ answer: j.answer || "", nodes: valid });
      } else {
        setPathResult({ answer: "寻路信号微弱，换个问法再试一次。", nodes: [] });
      }
    } catch (e) {
      setPathResult({ answer: "寻路失败，请稍后重试。", nodes: [] });
    }
    setPathLoading(false);
  };

  /* AI 提纯：把建言凝成共识晶体 */
  const refine = async () => {
    if (!selected || insights.length < 2 || refining) return;
    setRefining(true);
    const node = LAYOUT.byId[selected];
    const top = insights.slice(0, 8).map((i, k) => `${k + 1}. ${i.text}（${i.votes}赞）`).join("\n");
    const prompt = `以下是"${node.name}"节点下按点赞排序的建言：
${top}

请将其中的共识提纯为一段80字以内的中文结晶文本，客观凝练，不要评价建言本身，直接给出提纯后的内容，不要任何前缀。`;
    try {
      const text = (await askClaude(prompt)).trim();
      const c = { text, ts: Date.now(), n: insights.length };
      await sSet(`wt-crystal:${selected}`, c, true);
      setCrystal(c);
      showToast("共识已凝成晶体");
    } catch (e) {
      showToast("提纯失败，请稍后重试");
    }
    setRefining(false);
  };

  /* 视图拖拽 / 缩放 */
  const onPointerDown = (e) => {
    movedRef.current = false;
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) movedRef.current = true;
    setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }));
  };
  const onPointerUp = (e) => {     dragRef.current = null;     e.currentTarget.releasePointerCapture?.(e.pointerId);   };
  const zoom = (f) => setView((v) => ({ ...v, k: Math.min(2.4, Math.max(0.5, v.k * f)) }));
  const onWheel = (e) => zoom(e.deltaY < 0 ? 1.12 : 0.89);

  const lv = levelOf(profile.wp);
  const selNode = selected ? LAYOUT.byId[selected] : null;
  const highlighted = pathResult?.nodes || [];

  const linkPath = useCallback(([a, b]) => {
    const p = LAYOUT.byId[a], c = LAYOUT.byId[b];
    const mx = (p.x + c.x) * 0.5 * 1.12, my = (p.y + c.y) * 0.5 * 1.12;
    return `M ${p.x} ${p.y} Q ${mx} ${my} ${c.x} ${c.y}`;
  }, []);

  const domainColor = selNode ? (selNode.depth === 0 ? "#C4B5FD" : selNode.color) : "#C4B5FD";

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ background: "radial-gradient(1200px 800px at 50% 38%, #131A33 0%, #0A0E1C 58%, #070A14 100%)", color: "#E8ECF4", fontFamily: "'Noto Sans SC', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap');
        .serif { font-family: 'Noto Serif SC', serif; }
        @keyframes pulseRing { 0% { r: 14; opacity: .8 } 100% { r: 26; opacity: 0 } }
        @keyframes drift { 0%,100% { opacity:.25 } 50% { opacity:.7 } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform:none } }
        .fade-up { animation: fadeUp .35s ease both; }
        @media (prefers-reduced-motion: reduce) { .fade-up, .star { animation: none !important; } }
        ::-webkit-scrollbar { width: 6px } ::-webkit-scrollbar-thumb { background:#2A3554; border-radius:3px }
        input::placeholder, textarea::placeholder { color:#5A6584 }
      `}</style>

      {/* ---------- 顶栏 ---------- */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(180deg, rgba(7,10,20,.92), rgba(7,10,20,0))" }}>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="serif text-lg font-bold tracking-wide" style={{ color: "#EDE9FE" }}>世界树</span>
          <span className="hidden sm:inline text-xs" style={{ color: "#8B94AD" }}>人类智慧晶体库</span>
        </div>

        {/* AI 寻路 */}
        <div className="flex-1 max-w-xl relative">
          <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "rgba(20,27,52,.85)", border: "1px solid #26314F" }}>
            <span style={{ color: "#67E8F9" }}>✦</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findPath()}
              placeholder="向树发问，AI 为你寻路…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button onClick={findPath} disabled={pathLoading} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: pathLoading ? "#26314F" : "#67E8F9", color: pathLoading ? "#8B94AD" : "#08101F" }}>
              {pathLoading ? "寻路中…" : "寻路"}
            </button>
          </div>
          {pathResult && (
            <div className="fade-up absolute left-0 right-0 mt-2 rounded-2xl p-3 z-40" style={{ background: "rgba(16,22,44,.97)", border: "1px solid #2A3554" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#C9D2E8" }}>{pathResult.answer}</p>
              {pathResult.nodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pathResult.nodes.map((id) => (
                    <button key={id} onClick={() => openNode(id)} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(245,201,123,.14)", border: "1px solid rgba(245,201,123,.5)", color: "#F5C97B" }}>
                      前往「{LAYOUT.byId[id].name}」
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setPathResult(null)} className="absolute top-2 right-3 text-xs" style={{ color: "#5A6584" }}>✕</button>
            </div>
          )}
        </div>

        {/* 旅人等级 */}
        <div className="shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(20,27,52,.85)", border: "1px solid #26314F" }} title={lv.next ? `距「${lv.next.name}」还需 ${lv.next.wp - profile.wp} WP` : "已至世界树"}>
          <span className="text-sm" style={{ color: "#F5C97B" }}>{lv.cur.sym}</span>
          <div className="leading-none">
            <div className="text-xs font-medium">{lv.cur.name} <span style={{ color: "#8B94AD" }}>· {profile.wp} WP</span></div>
            <div className="mt-1 h-1 w-20 rounded-full overflow-hidden" style={{ background: "#1B2340" }}>
              <div className="h-full rounded-full" style={{ width: `${lv.pct}%`, background: "linear-gradient(90deg,#F5C97B,#67E8F9)" }} />
            </div>
          </div>
        </div>
      </header>

      {/* ---------- 树 ---------- */}
      <div
        className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}
      >
        <svg className="w-full h-full" viewBox="-380 -380 760 760" preserveAspectRatio="xMidYMid meet">
          {/* 微光星尘 */}
          {ready && [...Array(26)].map((_, i) => {
            const a = (i / 26) * Math.PI * 2, r = 90 + (i * 53) % 240;
            return <circle key={i} className="star" cx={Math.cos(a * 3.1 + i) * r} cy={Math.sin(a * 2.3 + i) * r} r={i % 4 === 0 ? 1.6 : 0.9} fill="#3B4A78" style={{ animation: `drift ${5 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }} />;
          })}

          <g transform={`translate(${view.tx / 2},${view.ty / 2}) scale(${view.k})`}>
            {/* 枝干 */}
            {LAYOUT.links.map(([a, b], i) => {
              const child = LAYOUT.byId[b];
              const hot = highlighted.includes(b) || selected === b || (selNode && selNode.parent === a && selNode.id === b);
              return (
                <path key={i} d={linkPath([a, b])} fill="none"
                  stroke={hot ? child.color : "#26314F"}
                  strokeWidth={child.depth === 1 ? 1.8 : 1}
                  strokeOpacity={hot ? 0.95 : 0.75}
                  style={hot ? { filter: `drop-shadow(0 0 4px ${child.color})` } : undefined}
                />
              );
            })}

            {/* 节点晶体 */}
            {LAYOUT.nodes.map((n) => {
              const isSel = selected === n.id;
              const isHot = highlighted.includes(n.id);
              const r = n.depth === 0 ? 20 : n.depth === 1 ? 12 : 8.5;
              const labelR = n.depth === 2 ? 16 : n.depth === 1 ? 20 : 0;
              const lx = n.depth === 0 ? 0 : Math.cos(n.angle) * labelR;
              const ly = n.depth === 0 ? 34 : Math.sin(n.angle) * labelR + 3;
              const anchor = n.depth === 0 ? "middle" : Math.abs(Math.cos(n.angle)) < 0.35 ? "middle" : Math.cos(n.angle) > 0 ? "start" : "end";
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer"
                  onClick={(e) => { if (movedRef.current) return; e.stopPropagation(); openNode(n.id); }}>
                  {isSel && <circle r="14" fill="none" stroke={n.color} strokeWidth="1.2" style={{ animation: "pulseRing 1.6s ease-out infinite" }} />}
                  {isHot && <circle r={r + 6} fill="none" stroke="#F5C97B" strokeWidth="1.4" strokeDasharray="3 3" />}
                  <polygon points={hexPoints(r)}
                    fill={isSel ? n.color : "rgba(14,20,40,.9)"}
                    stroke={n.color} strokeWidth={n.depth === 0 ? 2 : 1.4}
                    style={{ filter: `drop-shadow(0 0 ${isSel || isHot ? 9 : 4}px ${n.color}${isSel || isHot ? "" : "66"})`, transition: "fill .25s" }}
                  />
                  {n.depth === 0 && <polygon points={hexPoints(11)} fill="none" stroke="#EDE9FE" strokeWidth=".8" opacity=".7" />}
                  <text x={lx} y={ly} textAnchor={anchor}
                    fontSize={n.depth === 0 ? 15 : n.depth === 1 ? 12.5 : 10.5}
                    fontWeight={n.depth < 2 ? 700 : 500}
                    fill={isSel ? "#FFFFFF" : n.depth < 2 ? "#DDE4F5" : "#9AA6C4"}
                    className="serif select-none" style={{ paintOrder: "stroke", stroke: "#0A0E1C", strokeWidth: 3 }}>
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* 缩放控制 */}
        <div className="absolute bottom-5 left-4 flex flex-col gap-1.5 z-20">
          {[["＋", 1.2], ["－", 0.83]].map(([s, f]) => (
            <button key={s} onClick={() => zoom(f)} className="w-8 h-8 rounded-lg text-sm" style={{ background: "rgba(20,27,52,.9)", border: "1px solid #26314F", color: "#C9D2E8" }}>{s}</button>
          ))}
        </div>

        {!selected && (
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-center px-4 z-10" style={{ color: "#5A6584" }}>
            点击任意晶体节点，阅读或留下你的建言 · 拖动漫游，滚轮缩放
          </p>
        )}
      </div>

      {/* ---------- 节点面板 ---------- */}
      {selNode && (
        <aside className="fade-up absolute z-30 flex flex-col"
          style={{
            background: "rgba(13,18,38,.97)", border: "1px solid #26314F", boxShadow: "0 -8px 40px rgba(0,0,0,.5)",
            ...(isMobile
              ? { left: 0, right: 0, bottom: 0, top: "40%", borderRadius: "18px 18px 0 0" }
              : { top: 64, right: 16, bottom: 16, width: 380, borderRadius: 18 }),
          }}>
          {/* 头部 */}
          <div className="p-4 pb-3" style={{ borderBottom: "1px solid #1B2340" }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rotate-45" style={{ background: domainColor, boxShadow: `0 0 8px ${domainColor}` }} />
                  <h2 className="serif text-lg font-bold">{selNode.name}</h2>
                </div>
                <p className="text-xs mt-1" style={{ color: "#8B94AD" }}>{selNode.desc}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm px-2 py-1 rounded-lg" style={{ color: "#8B94AD", background: "#161D38" }}>✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 共识晶体 */}
            <section className="rounded-xl p-3" style={{ background: "linear-gradient(140deg, rgba(103,232,249,.07), rgba(167,139,250,.07))", border: `1px solid ${domainColor}44` }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-widest" style={{ color: domainColor }}>◇ 共识晶体</h3>
                <button onClick={refine} disabled={refining || insights.length < 2}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: insights.length < 2 ? "#161D38" : "rgba(103,232,249,.15)", border: "1px solid #2A3554", color: insights.length < 2 ? "#5A6584" : "#67E8F9" }}>
                  {refining ? "提纯中…" : "AI 提纯"}
                </button>
              </div>
              {crystal ? (
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#DDE4F5" }}>{crystal.text}</p>
              ) : (
                <p className="text-xs mt-2" style={{ color: "#5A6584" }}>
                  {insights.length < 2 ? "至少两条建言后，可将共识提纯为晶体。" : "尚未提纯。点击「AI 提纯」凝结这里的共识。"}
                </p>
              )}
            </section>

            {/* 建言列表 */}
            <section>
              <h3 className="text-xs font-bold tracking-widest mb-2" style={{ color: "#8B94AD" }}>建言 · {insights.length}</h3>
              {loadingNode ? (
                <p className="text-xs" style={{ color: "#5A6584" }}>正在读取晶体…</p>
              ) : insights.length === 0 ? (
                <p className="text-xs leading-relaxed" style={{ color: "#5A6584" }}>这片枝叶还是空白。写下第一条建言，为后来者点一盏灯。</p>
              ) : (
                <ul className="space-y-2">
                  {insights.map((it) => {
                    const votedIt = profile.voted.includes(it.id);
                    return (
                      <li key={it.id} className="rounded-xl p-3" style={{ background: "#121A34", border: "1px solid #1E2848" }}>
                        <p className="text-sm leading-relaxed" style={{ color: "#DDE4F5" }}>{it.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs" style={{ color: "#5A6584" }}>{it.author}</span>
                          <button onClick={() => vote(it.id)} disabled={votedIt}
                            className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                            style={{ background: votedIt ? "rgba(245,201,123,.14)" : "#161D38", border: `1px solid ${votedIt ? "rgba(245,201,123,.5)" : "#2A3554"}`, color: votedIt ? "#F5C97B" : "#9AA6C4" }}>
                            ◆ {it.votes}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* 提交区 */}
          <div className="p-3" style={{ borderTop: "1px solid #1B2340" }}>
            {!profile.name && (
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="你的名号（可留空，默认「无名旅人」）"
                className="w-full mb-2 text-xs rounded-lg px-3 py-2 outline-none" style={{ background: "#121A34", border: "1px solid #1E2848", color: "#DDE4F5" }} />
            )}
            <div className="flex gap-2">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                placeholder={`在「${selNode.name}」上刻下一条建言…`}
                className="flex-1 text-sm rounded-lg px-3 py-2 outline-none resize-none"
                style={{ background: "#121A34", border: "1px solid #1E2848", color: "#DDE4F5" }} />
              <button onClick={submitInsight} disabled={!draft.trim()}
                className="px-4 rounded-lg text-sm font-medium self-stretch"
                style={{ background: draft.trim() ? domainColor : "#161D38", color: draft.trim() ? "#08101F" : "#5A6584" }}>
                刻入
              </button>
            </div>
            <p className="mt-1.5" style={{ color: "#3E4767", fontSize: 10 }}>建言与点赞对所有旅人可见，将永久沉淀于晶体库 · 建言 +15 WP，点赞 +2 WP</p>
          </div>
        </aside>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className="fade-up absolute top-16 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2 rounded-full"
          style={{ background: "rgba(245,201,123,.12)", border: "1px solid rgba(245,201,123,.55)", color: "#F5C97B", backdropFilter: "blur(6px)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
