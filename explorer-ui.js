import { jsxs as o, jsx as t } from "react/jsx-runtime";
import { forwardRef as Ke, createElement as Se, useState as j, useMemo as Y, useEffect as oe, useCallback as P } from "react";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ot = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), We = (...e) => e.filter((n, d, a) => !!n && n.trim() !== "" && a.indexOf(n) === d).join(" ").trim();
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var st = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const it = Ke(
  ({
    color: e = "currentColor",
    size: n = 24,
    strokeWidth: d = 2,
    absoluteStrokeWidth: a,
    className: w = "",
    children: u,
    iconNode: x,
    ...N
  }, g) => Se(
    "svg",
    {
      ref: g,
      ...st,
      width: n,
      height: n,
      stroke: e,
      strokeWidth: a ? Number(d) * 24 / Number(n) : d,
      className: We("lucide", w),
      ...N
    },
    [
      ...x.map(([m, M]) => Se(m, M)),
      ...Array.isArray(u) ? u : [u]
    ]
  )
);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const z = (e, n) => {
  const d = Ke(
    ({ className: a, ...w }, u) => Se(it, {
      ref: u,
      iconNode: n,
      className: We(`lucide-${ot(e)}`, a),
      ...w
    })
  );
  return d.displayName = `${e}`, d;
};
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ct = z("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const dt = z("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ge = z("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ut = z("Code", [
  ["polyline", { points: "16 18 22 12 16 6", key: "z7tu5w" }],
  ["polyline", { points: "8 6 2 12 8 18", key: "1eg1df" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const De = z("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Fe = z("FileJson", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  [
    "path",
    { d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1", key: "1oajmo" }
  ],
  [
    "path",
    { d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1", key: "mpwhp6" }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const mt = z("FileText", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const pt = z("Folder", [
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ft = z("Layers", [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const bt = z("Link2", [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ht = z("List", [
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M3 18h.01", key: "1tta3j" }],
  ["path", { d: "M3 6h.01", key: "1rqtza" }],
  ["path", { d: "M8 12h13", key: "1za7za" }],
  ["path", { d: "M8 18h13", key: "1lx6n3" }],
  ["path", { d: "M8 6h13", key: "ik3vkj" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ve = z("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const xt = z("Square", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const yt = z("ToggleLeft", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "6", ry: "6", key: "f2vt7d" }],
  ["circle", { cx: "8", cy: "12", r: "2", key: "1nvbw3" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const gt = z("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const vt = z("Type", [
  ["polyline", { points: "4 7 4 4 20 4 20 7", key: "1nosan" }],
  ["line", { x1: "9", x2: "15", y1: "20", y2: "20", key: "swin9y" }],
  ["line", { x1: "12", x2: "12", y1: "4", y2: "20", key: "1tx1rr" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Re = z("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ee = z("Zap", [
  [
    "path",
    {
      d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
      key: "1xq2db"
    }
  ]
]);
function S(...e) {
  return e.filter(Boolean).join(" ");
}
const be = {
  wrapper: "flex items-center justify-between gap-4 rounded-[16px] border border-slate-200 bg-white/90 px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur",
  title: "text-lg font-semibold text-slate-900",
  subtitle: "text-xs text-slate-500",
  select: "flex w-full items-center justify-between gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-emerald-300/60 focus:outline-none"
};
function wt({ catalogs: e, activeDatabase: n, onSelectDatabase: d }) {
  return /* @__PURE__ */ o("header", { className: be.wrapper, children: [
    /* @__PURE__ */ o("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ t("div", { className: "flex h-11 w-11 items-center justify-center rounded-[14px] border border-emerald-200/70 bg-emerald-50", children: /* @__PURE__ */ t(De, { className: "h-5 w-5 text-emerald-600" }) }),
      /* @__PURE__ */ o("div", { children: [
        /* @__PURE__ */ t("div", { className: be.title, children: "MongoLive Explorer" }),
        /* @__PURE__ */ t("div", { className: be.subtitle, children: "Realtime mock client for dashboard validation" })
      ] })
    ] }),
    /* @__PURE__ */ o("div", { className: "min-w-[220px]", children: [
      /* @__PURE__ */ t("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400", children: "Database" }),
      /* @__PURE__ */ o("div", { className: "relative", children: [
        /* @__PURE__ */ t(
          "select",
          {
            className: S(be.select, "appearance-none pr-8"),
            value: n ?? "",
            onChange: (a) => d(a.target.value),
            children: e.map((a) => /* @__PURE__ */ t("option", { value: a.database, children: a.database }, a.database))
          }
        ),
        /* @__PURE__ */ t(dt, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" })
      ] })
    ] })
  ] });
}
const ne = {
  container: "flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm",
  crumb: "flex items-center gap-2 font-medium text-slate-700",
  muted: "text-slate-400"
};
function Nt({
  activeDatabase: e,
  activeCollection: n,
  activeDocumentId: d,
  pathSegments: a,
  onSelectPathDepth: w
}) {
  return /* @__PURE__ */ o("div", { className: ne.container, children: [
    /* @__PURE__ */ o("div", { className: ne.crumb, children: [
      /* @__PURE__ */ t(De, { className: "h-4 w-4 text-emerald-500" }),
      /* @__PURE__ */ t("span", { children: e ?? "Select database" })
    ] }),
    /* @__PURE__ */ t(ge, { className: ne.muted }),
    /* @__PURE__ */ o("div", { className: ne.crumb, children: [
      /* @__PURE__ */ t(pt, { className: "h-4 w-4 text-emerald-500" }),
      /* @__PURE__ */ t("span", { children: n ?? "Select collection" })
    ] }),
    /* @__PURE__ */ t(ge, { className: ne.muted }),
    /* @__PURE__ */ o(
      "button",
      {
        type: "button",
        onClick: () => w == null ? void 0 : w(0),
        className: S(ne.crumb, !d && ne.muted),
        children: [
          /* @__PURE__ */ t(Fe, { className: "h-4 w-4" }),
          /* @__PURE__ */ t("span", { children: d ?? "Select document" })
        ]
      }
    ),
    a.map((u, x) => /* @__PURE__ */ o("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ t(ge, { className: ne.muted }),
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: ne.crumb,
          onClick: () => w == null ? void 0 : w(x + 1),
          children: u
        }
      )
    ] }, `${u}-${x}`))
  ] });
}
const Be = "0123456789abcdef";
function Ae() {
  let e = "";
  for (let n = 0; n < 24; n += 1)
    e += Be[Math.floor(Math.random() * Be.length)];
  return e;
}
const Ze = (e) => !!e && typeof e == "object" && !Array.isArray(e) && typeof e.$oid == "string", ie = (e) => typeof e == "string" ? e : typeof e == "number" ? String(e) : Ze(e) ? e.$oid : e && typeof e == "object" && "toString" in e ? String(e) : null, _e = (e) => ({ $oid: e }), C = {
  container: "mt-3 rounded-[10px] border border-slate-200 bg-white p-3",
  headerRow: "flex items-center gap-2",
  keyInput: "flex-1 rounded-[8px] border border-slate-200 px-2 py-1 text-sm",
  badge: "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600",
  typeButton: "rounded-[8px] border border-slate-200 px-2 py-1 text-xs flex items-center gap-1",
  typeButtonDisabled: "opacity-60",
  typeButtonLabel: "font-semibold text-sm",
  icon: "h-4 w-4",
  typePanel: "mt-3 overflow-hidden transition-all",
  typePanelOpen: "max-h-40",
  typePanelClosed: "max-h-0",
  typeList: "flex flex-wrap gap-2 py-2 w-full",
  typeItem: "rounded-md border px-2 py-1 text-sm flex items-center gap-1",
  typeItemActive: "border-emerald-400 bg-emerald-50",
  typeItemInactive: "border-slate-200 bg-white",
  valueBlock: "mt-3",
  select: "rounded-[8px] border border-slate-200 px-2 py-1 text-sm",
  input: "w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm",
  textarea: "w-full h-28 rounded-[8px] border border-slate-200 px-2 py-2 text-sm font-mono",
  error: "mt-2 text-xs text-rose-600",
  actions: "mt-3 flex justify-end gap-2",
  cancel: "rounded-[8px] border border-slate-200 px-3 py-1 text-sm",
  submit: "rounded-[8px] bg-emerald-500 px-3 py-1 text-sm text-white flex items-center gap-2"
}, Pe = [
  { key: "string", label: "String", icon: vt, tone: "text-emerald-700" },
  { key: "number", label: "Number", icon: Ee, tone: "text-blue-600" },
  { key: "boolean", label: "Boolean", icon: yt, tone: "text-rose-600" },
  { key: "object", label: "Object", icon: xt, tone: "text-indigo-600" },
  { key: "array", label: "Array", icon: ht, tone: "text-amber-600" },
  { key: "objectId", label: "ObjectId", icon: Ee, tone: "text-slate-600" },
  { key: "reference", label: "Reference", icon: bt, tone: "text-slate-600" },
  { key: "json", label: "JSON", icon: ut, tone: "text-slate-700" }
], ze = `{
  "title": ""
}`;
function Oe({
  mode: e,
  parentPath: n = [],
  parentIsArray: d = !1,
  nextArrayIndex: a = 0,
  rootDocumentId: w = null,
  onCancel: u,
  onSubmitField: x,
  onSubmitDocument: N,
  onSubmitCollection: g
}) {
  const m = e === "collection" ? "string" : e === "document" ? "json" : null, M = e === "field" ? Pe : Pe.filter((h) => h.key === m), [p, L] = j(""), [f, $] = j(m ?? "string"), [q, k] = j(!1), [A, D] = j(""), [R, H] = j(!0), [E, K] = j(""), [I, Z] = j(null), [se, Q] = j(""), [X, le] = j(ze), [re, ee] = j(null), ce = Y(() => M.find((h) => h.key === f) ?? M[0], [f, M]);
  oe(() => {
    m && $(m);
  }, [m]), oe(() => {
    if (e === "document")
      try {
        const h = JSON.parse(X);
        if (h && typeof h == "object") {
          const G = h.title;
          typeof G == "string" && Q(G);
        }
      } catch {
      }
  }, [X, e]);
  const de = () => {
    L(""), $(m ?? "string"), D(""), H(!0), K(""), Z(null), Q(""), le(ze), ee(null);
  }, we = () => {
    if (Z(null), ee(null), e === "collection") {
      const J = p.trim();
      if (!J) {
        ee("Collection name is required");
        return;
      }
      g == null || g(J), de(), u();
      return;
    }
    if (e === "document") {
      if (!N) return;
      try {
        const J = JSON.parse(X || "{}"), ae = J && typeof J == "object" ? { ...J } : {};
        se && (ae.title = se), N(ae), de(), u();
        return;
      } catch (J) {
        Z(J instanceof Error ? J.message : "Invalid JSON");
        return;
      }
    }
    if (!x || !w) return;
    if (!d && !p.trim()) {
      ee("Key is required");
      return;
    }
    let h = null;
    if (f === "string") h = A;
    else if (f === "number") h = E === "" ? 0 : Number(E);
    else if (f === "boolean") h = R;
    else if (f === "objectId") h = _e(Ae());
    else if (f === "reference") {
      const J = A.trim();
      let ae = ie(J);
      if (!ae)
        try {
          const Ie = JSON.parse(J);
          ae = ie(Ie);
        } catch {
          ae = null;
        }
      h = _e(ae ?? Ae());
    } else if (f === "object" || f === "array" || f === "json")
      try {
        A.trim() ? h = JSON.parse(A) : h = f === "array" ? [] : {};
      } catch (J) {
        Z(J instanceof Error ? J.message : "Invalid JSON");
        return;
      }
    const G = d ? { type: "index", index: a } : { type: "key", key: p.trim() };
    x(w, n, G, h), de(), u();
  }, Ne = () => e === "document" ? /* @__PURE__ */ t(
    "input",
    {
      value: se,
      onChange: (h) => {
        const G = h.target.value;
        Q(G);
        try {
          const J = JSON.parse(X || "{}");
          J && typeof J == "object" && (J.title = G, le(JSON.stringify(J, null, 2)));
        } catch {
        }
      },
      placeholder: "document title",
      className: C.input
    }
  ) : e === "collection" ? /* @__PURE__ */ t(
    "input",
    {
      value: p,
      onChange: (h) => L(h.target.value),
      placeholder: "collection name",
      className: C.keyInput
    }
  ) : d ? /* @__PURE__ */ o("span", { className: C.badge, children: [
    "Index: ",
    a
  ] }) : /* @__PURE__ */ t(
    "input",
    {
      value: p,
      onChange: (h) => L(h.target.value),
      placeholder: "key name",
      className: C.keyInput
    }
  ), ke = () => /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      onClick: () => k((h) => !h),
      className: S(C.typeButton, m && C.typeButtonDisabled),
      disabled: !!m,
      children: [
        /* @__PURE__ */ t(ce.icon, { className: S(C.icon, ce.tone) }),
        /* @__PURE__ */ t("span", { className: C.typeButtonLabel, children: ce.label })
      ]
    }
  ), Ce = () => e === "document" ? /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ t(
    "textarea",
    {
      value: X,
      onChange: (h) => le(h.target.value),
      className: C.textarea
    }
  ) }) : f === "boolean" ? /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ o("select", { value: String(R), onChange: (h) => H(h.target.value === "true"), className: C.select, children: [
    /* @__PURE__ */ t("option", { value: "true", children: "true" }),
    /* @__PURE__ */ t("option", { value: "false", children: "false" })
  ] }) }) : f === "number" ? /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ t("input", { type: "number", value: E, onChange: (h) => K(h.target.value === "" ? "" : Number(h.target.value)), className: C.input }) }) : f === "object" || f === "array" || f === "json" || f === "reference" ? /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ t(
    "textarea",
    {
      value: A,
      onChange: (h) => D(h.target.value),
      className: C.textarea,
      placeholder: f === "reference" ? 'Paste target ObjectId or JSON {"$oid": "..."}' : "Paste JSON here, or leave empty for {} / []"
    }
  ) }) : f === "objectId" ? /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ t("div", { className: C.badge, children: "ObjectId will be generated automatically" }) }) : /* @__PURE__ */ t("div", { className: C.valueBlock, children: /* @__PURE__ */ t("input", { value: A, onChange: (h) => D(h.target.value), className: C.input }) });
  return /* @__PURE__ */ o("div", { className: C.container, children: [
    /* @__PURE__ */ o("div", { className: C.headerRow, children: [
      ke(),
      Ne()
    ] }),
    e === "field" ? /* @__PURE__ */ t("div", { className: S(C.typePanel, q ? C.typePanelOpen : C.typePanelClosed), children: /* @__PURE__ */ t("div", { className: C.typeList, children: M.map((h) => {
      const G = h.icon, J = h.key === f;
      return /* @__PURE__ */ o(
        "button",
        {
          type: "button",
          onClick: () => {
            $(h.key), k(!1);
          },
          className: S(C.typeItem, J ? C.typeItemActive : C.typeItemInactive),
          children: [
            /* @__PURE__ */ t(G, { className: S(C.icon, h.tone) }),
            /* @__PURE__ */ t("span", { children: h.label })
          ]
        },
        h.key
      );
    }) }) }) : null,
    Ce(),
    re ? /* @__PURE__ */ t("div", { className: C.error, children: re }) : null,
    I ? /* @__PURE__ */ t("div", { className: C.error, children: I }) : null,
    /* @__PURE__ */ o("div", { className: C.actions, children: [
      /* @__PURE__ */ t("button", { type: "button", onClick: u, className: C.cancel, children: "Cancel" }),
      /* @__PURE__ */ o("button", { type: "button", onClick: we, className: C.submit, children: [
        /* @__PURE__ */ t(ct, { className: C.icon }),
        "Add"
      ] })
    ] })
  ] });
}
const B = {
  card: "flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
  title: "flex items-center gap-2 text-sm font-semibold text-slate-900 p-4",
  item: "flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left text-sm transition",
  meta: "text-xs text-slate-500",
  itemHover: "hover:bg-emerald-50/60 hover:border-emerald-200/60",
  list: "flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1",
  skeleton: "flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition",
  empty: "rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500",
  itemActive: "border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]",
  itemInactive: "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900",
  rowMeta: "text-xs font-semibold text-emerald-700",
  name: "font-semibold",
  inlineWrap: "w-full",
  expandedWrap: "overflow-hidden transition-all duration-300",
  expandedOpen: "max-h-[520px] opacity-100",
  expandedClosed: "max-h-0 opacity-0",
  expandedInner: "transform transition-all duration-300",
  expandedInnerOpen: "translate-y-0 opacity-100",
  expandedInnerClosed: "-translate-y-2 opacity-0",
  icon: "h-4 w-4",
  iconAccent: "h-4 w-4 text-emerald-500"
};
function kt({
  collections: e,
  activeCollection: n,
  onSelectCollection: d,
  onOpenManager: a,
  onAddCollection: w
}) {
  const [u, x] = j(!1);
  return /* @__PURE__ */ o("section", { className: B.card, children: [
    /* @__PURE__ */ o("div", { className: B.title, children: [
      /* @__PURE__ */ t(ft, { className: B.iconAccent }),
      "Collections"
    ] }),
    /* @__PURE__ */ o("div", { className: B.list, children: [
      e.length === 0 ? /* @__PURE__ */ t("div", { className: B.empty, children: "No collections yet. Add one from the floating manager." }) : e.map((N) => {
        const g = n === N.collection.name;
        return /* @__PURE__ */ o(
          "button",
          {
            type: "button",
            onClick: () => d(N.collection.name),
            className: S(
              B.item,
              B.itemHover,
              g ? B.itemActive : B.itemInactive
            ),
            children: [
              /* @__PURE__ */ o("div", { children: [
                /* @__PURE__ */ t("div", { className: B.name, children: N.collection.name }),
                /* @__PURE__ */ o("div", { className: B.meta, children: [
                  N.collection.documentCount,
                  " docs"
                ] })
              ] }),
              /* @__PURE__ */ o("div", { className: B.rowMeta, children: [
                N.collection.sizeMb,
                " MB"
              ] })
            ]
          },
          N.collection.name
        );
      }),
      /* @__PURE__ */ t("div", { className: B.inlineWrap, children: /* @__PURE__ */ t("div", { className: S(B.expandedWrap, u ? B.expandedOpen : B.expandedClosed), children: /* @__PURE__ */ t("div", { className: S(B.expandedInner, u ? B.expandedInnerOpen : B.expandedInnerClosed), children: /* @__PURE__ */ t(
        Oe,
        {
          mode: "collection",
          onCancel: () => x(!1),
          onSubmitCollection: (N) => w == null ? void 0 : w(N)
        }
      ) }) }) }),
      u ? null : /* @__PURE__ */ o("button", { type: "button", onClick: () => x(!0), className: S(B.skeleton, B.itemHover), children: [
        /* @__PURE__ */ t("span", { children: "Add collection or data" }),
        /* @__PURE__ */ t(ve, { className: B.icon })
      ] })
    ] })
  ] });
}
const O = {
  card: "flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
  title: "flex items-center gap-2 text-sm font-semibold text-slate-900 p-4",
  item: "flex w-full flex-col gap-1 rounded-[12px] border px-3 py-2 text-left text-sm transition",
  meta: "text-xs text-slate-500",
  remove: "inline-flex items-center gap-1 text-xs text-rose-500 transition hover:text-rose-600",
  itemHover: "hover:bg-emerald-50/60 hover:border-emerald-200/60",
  itemActive: "border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]",
  itemInactive: "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900",
  list: "flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1",
  skeleton: "flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition",
  empty: "rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500",
  rowTop: "flex items-center justify-between",
  rowBottom: "flex items-center justify-between",
  idBadge: "text-xs text-slate-500",
  expandedWrap: "overflow-hidden transition-all duration-300",
  expandedOpen: "max-h-[520px] opacity-100",
  expandedClosed: "max-h-0 opacity-0",
  expandedInner: "transform transition-all duration-300",
  expandedInnerOpen: "translate-y-0 opacity-100",
  expandedInnerClosed: "-translate-y-2 opacity-0",
  inlineWrap: "w-full",
  icon: "h-4 w-4",
  iconSmall: "h-3 w-3",
  titleText: "font-semibold",
  iconAccent: "h-4 w-4 text-emerald-500"
}, Ct = (e) => ie(e._id) ?? "", It = (e, n) => {
  const d = e.title;
  return typeof d == "string" || typeof d == "number" ? String(d) : n;
};
function St({
  documents: e,
  activeDocumentId: n,
  onSelectDocument: d,
  onRemoveDocument: a,
  onOpenManager: w,
  onAddDocument: u
}) {
  const [x, N] = j(!1);
  return /* @__PURE__ */ o("section", { className: O.card, children: [
    /* @__PURE__ */ o("div", { className: O.title, children: [
      /* @__PURE__ */ t(mt, { className: O.iconAccent }),
      "Documents"
    ] }),
    /* @__PURE__ */ o("div", { className: O.list, children: [
      e.length === 0 ? /* @__PURE__ */ t("div", { className: O.empty, children: "Select a collection to load documents." }) : e.map((g, m) => {
        const M = Ct(g), p = n === M;
        return /* @__PURE__ */ o(
          "button",
          {
            type: "button",
            onClick: () => d(g),
            className: S(
              O.item,
              O.itemHover,
              p ? O.itemActive : O.itemInactive
            ),
            children: [
              /* @__PURE__ */ o("div", { className: O.rowTop, children: [
                /* @__PURE__ */ t("div", { className: O.titleText, children: It(g, M || "Document") }),
                M ? /* @__PURE__ */ o("span", { className: O.idBadge, children: [
                  M.slice(0, 6),
                  "..."
                ] }) : /* @__PURE__ */ t("span", { className: O.meta, children: "no id" })
              ] }),
              /* @__PURE__ */ o("div", { className: O.rowBottom, children: [
                /* @__PURE__ */ o("div", { className: O.meta, children: [
                  "Fields: ",
                  Object.keys(g).length
                ] }),
                M ? /* @__PURE__ */ o(
                  "span",
                  {
                    role: "button",
                    tabIndex: 0,
                    onClick: (L) => {
                      L.stopPropagation(), a(M);
                    },
                    onKeyDown: (L) => {
                      (L.key === "Enter" || L.key === " ") && (L.preventDefault(), a(M));
                    },
                    className: O.remove,
                    children: [
                      /* @__PURE__ */ t(gt, { className: O.iconSmall }),
                      "Remove"
                    ]
                  }
                ) : null
              ] })
            ]
          },
          M || `doc-${m}`
        );
      }),
      /* @__PURE__ */ t("div", { className: O.inlineWrap, children: /* @__PURE__ */ t("div", { className: S(O.expandedWrap, x ? O.expandedOpen : O.expandedClosed), children: /* @__PURE__ */ t("div", { className: S(O.expandedInner, x ? O.expandedInnerOpen : O.expandedInnerClosed), children: /* @__PURE__ */ t(
        Oe,
        {
          mode: "document",
          onCancel: () => N(!1),
          onSubmitDocument: (g) => {
            u == null || u(g);
          }
        }
      ) }) }) }),
      x ? null : /* @__PURE__ */ o("button", { type: "button", onClick: () => N(!0), className: S(O.skeleton, O.itemHover), children: [
        /* @__PURE__ */ t("span", { children: "Add document or JSON" }),
        /* @__PURE__ */ t(ve, { className: O.icon })
      ] })
    ] })
  ] });
}
const je = "__root__", me = (e) => e.map((n) => n.type === "key" ? n.key : n.type === "index" ? `[${n.index}]` : `@${n.id}`).join("."), At = (e) => e.type === "key" ? e.key : e.type === "index" ? `[${e.index}]` : e.id, b = {
  card: "flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition",
  cardRef: "border-emerald-200/70 bg-emerald-50/40",
  header: "flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 p-4",
  headerRef: "text-emerald-800",
  headerLeft: "flex items-center gap-2",
  headerId: "text-xs text-slate-400",
  icon: "h-4 w-4 text-emerald-500",
  iconRef: "text-emerald-600",
  empty: "flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500",
  list: "flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1",
  row: "flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left text-sm transition",
  rowActive: "border-emerald-400/60 bg-emerald-50 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]",
  rowInactive: "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900",
  rowStatic: "border-slate-200 bg-white",
  itemHover: "hover:bg-emerald-50/60 hover:border-emerald-200/60",
  badge: "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
  highlight: "ring-2 ring-emerald-200/80",
  skeleton: "flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition",
  rowLeft: "flex items-center gap-2",
  rowLabel: "font-semibold text-slate-800",
  rowRight: "flex items-center gap-2 text-xs text-slate-500",
  rowMeta: "text-[11px] text-slate-400",
  rowPrevious: "border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]",
  inputWrap: "w-[52%]",
  inlineInput: "w-full rounded-[8px] border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-300/70 focus:outline-none",
  iconSmall: "h-4 w-4",
  flexOne: "flex-1"
}, $e = (e) => !!e && typeof e == "object" && !Array.isArray(e), _t = (e) => Array.isArray(e) || $e(e), He = (e) => e === null ? "null" : typeof e == "string" ? e : typeof e == "number" || typeof e == "boolean" ? String(e) : "", Ve = (e) => {
  const n = e.trim();
  return n === "true" ? !0 : n === "false" ? !1 : n === "null" ? null : n !== "" && !Number.isNaN(Number(n)) ? Number(n) : e;
}, jt = (e, n = !1) => n ? { label: "objectId", tone: "text-slate-600", badge: "OID" } : e === null ? { label: "null", tone: "text-slate-500", badge: "null" } : Array.isArray(e) ? { label: "array", tone: "text-amber-600", badge: "[]" } : $e(e) ? { label: "object", tone: "text-indigo-600", badge: "{}" } : typeof e == "string" ? { label: "string", tone: "text-emerald-700", badge: "abc" } : typeof e == "number" ? { label: "number", tone: "text-blue-600", badge: "123" } : typeof e == "boolean" ? { label: "boolean", tone: "text-rose-600", badge: "bool" } : { label: "value", tone: "text-slate-500", badge: "val" };
function Mt({
  label: e,
  value: n,
  isObjectId: d = !1,
  isPreviousPath: a = !1,
  path: w,
  segment: u,
  rootDocumentId: x,
  isReference: N,
  isExpandable: g,
  isHighlighted: m,
  columnDepth: M,
  allowPrimitiveClick: p,
  onOpenPath: L,
  onUpdateValue: f
}) {
  const [$, q] = j(He(n)), k = jt(n, d);
  return oe(() => {
    q(He(n));
  }, [n]), g || N ? /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      onClick: () => L(M, u),
      className: S(
        b.row,
        b.itemHover,
        m && b.rowActive,
        a ? b.rowPrevious : b.rowInactive
      ),
      children: [
        /* @__PURE__ */ o("div", { children: [
          /* @__PURE__ */ o("div", { className: b.rowLeft, children: [
            /* @__PURE__ */ t("span", { className: S(b.badge, k.tone), children: k.badge }),
            /* @__PURE__ */ t("span", { className: b.rowLabel, children: e })
          ] }),
          /* @__PURE__ */ t("div", { className: S(b.rowMeta, k.tone), children: N ? "reference" : Array.isArray(n) ? `array (${n.length})` : "object" })
        ] }),
        /* @__PURE__ */ o("div", { className: b.rowRight, children: [
          N ? "ref" : Array.isArray(n) ? "expand" : "open",
          /* @__PURE__ */ t(ge, { className: b.iconSmall })
        ] })
      ]
    }
  ) : p ? /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      onClick: () => L(M, u, !0),
      className: S(
        b.row,
        b.rowStatic,
        b.itemHover,
        m && b.rowActive,
        a && b.rowPrevious
      ),
      children: [
        /* @__PURE__ */ o("div", { className: b.flexOne, children: [
          /* @__PURE__ */ o("div", { className: b.rowLeft, children: [
            /* @__PURE__ */ t("span", { className: S(b.badge, k.tone), children: k.badge }),
            /* @__PURE__ */ t("span", { className: b.rowLabel, children: e })
          ] }),
          /* @__PURE__ */ t("div", { className: S(b.rowMeta, k.tone), children: n === null ? "null" : typeof n })
        ] }),
        /* @__PURE__ */ t("div", { className: b.inputWrap, children: /* @__PURE__ */ t(
          "input",
          {
            value: $,
            onClick: (A) => A.stopPropagation(),
            onChange: (A) => q(A.target.value),
            onBlur: () => {
              x && f(x, [...w, u], Ve($));
            },
            onKeyDown: (A) => {
              A.key === "Enter" && A.currentTarget.blur();
            },
            className: b.inlineInput
          }
        ) })
      ]
    }
  ) : /* @__PURE__ */ o(
    "div",
    {
      className: S(
        b.row,
        b.rowStatic,
        m && b.rowActive,
        a && b.rowPrevious
      ),
      children: [
        /* @__PURE__ */ o("div", { className: b.flexOne, children: [
          /* @__PURE__ */ o("div", { className: b.rowLeft, children: [
            /* @__PURE__ */ t("span", { className: S(b.badge, k.tone), children: k.badge }),
            /* @__PURE__ */ t("span", { className: b.rowLabel, children: e })
          ] }),
          /* @__PURE__ */ t("div", { className: S(b.rowMeta, k.tone), children: n === null ? "null" : d ? "objectId" : typeof n })
        ] }),
        /* @__PURE__ */ t("div", { className: b.inputWrap, children: /* @__PURE__ */ t(
          "input",
          {
            value: $,
            onChange: (A) => q(A.target.value),
            onBlur: () => {
              x && f(x, [...w, u], Ve($));
            },
            onKeyDown: (A) => {
              A.key === "Enter" && A.currentTarget.blur();
            },
            className: b.inlineInput
          }
        ) })
      ]
    }
  );
}
function Dt({
  title: e,
  value: n,
  path: d,
  rootDocumentId: a,
  columnDepth: w,
  highlight: u,
  allowPrimitiveClick: x,
  isReferenceColumn: N = !1,
  activeSegment: g = null,
  checkValidReference: m,
  onOpenManager: M,
  onOpenPath: p,
  onUpdateValue: L
}) {
  const [f, $] = j(!1);
  Array.isArray(n) && n.length;
  const k = Array.isArray(n) ? n.map((D, R) => ({
    label: `[${R}]`,
    segment: { type: "index", index: R },
    value: D
  })) : $e(n) ? Object.entries(n).map(([D, R]) => ({
    label: D,
    segment: { type: "key", key: D },
    value: R
  })) : [], A = u.rootId === a && u.pathKey === je;
  return /* @__PURE__ */ o("section", { className: S(b.card, N && b.cardRef, A && b.highlight), children: [
    /* @__PURE__ */ o("div", { className: S(b.header, N && b.headerRef), children: [
      /* @__PURE__ */ o("div", { className: b.headerLeft, children: [
        /* @__PURE__ */ t(Fe, { className: S(b.icon, N && b.iconRef) }),
        e
      ] }),
      a ? /* @__PURE__ */ t("span", { className: b.headerId, children: a.slice(-6) }) : null
    ] }),
    /* @__PURE__ */ o("div", { className: b.list, children: [
      k.length === 0 ? /* @__PURE__ */ t("div", { className: b.empty, children: n == null ? "Select a document to explore JSON." : "No nested fields at this level." }) : k.map((D) => {
        const R = Ze(D.value) ? D.value.$oid : null, H = D.label === "_id" && !!R, E = !H && R ? m(R) : null, K = !!E, I = K ? { type: "reference", id: R } : D.segment, Z = H || R && !E ? R : D.value, se = H ? !1 : _t(Z), Q = me([...d, I]), X = g && me([I]) === me([g]), le = u.rootId === a && u.pathKey === Q;
        return /* @__PURE__ */ t(
          Mt,
          {
            label: D.label,
            value: Z,
            isObjectId: H,
            isPreviousPath: !!X,
            path: d,
            segment: I,
            rootDocumentId: a,
            isReference: K,
            isExpandable: se,
            isHighlighted: le,
            columnDepth: w,
            allowPrimitiveClick: x,
            onOpenPath: p,
            onUpdateValue: L
          },
          `${D.label}-${Q}`
        );
      }),
      /* @__PURE__ */ o("div", { className: "w-full", children: [
        /* @__PURE__ */ t("div", { className: S("overflow-hidden transition-all duration-300", f ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"), children: /* @__PURE__ */ t("div", { className: S("transform transition-all duration-300", f ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"), children: /* @__PURE__ */ t(
          Oe,
          {
            mode: "field",
            parentPath: d,
            rootDocumentId: a,
            onCancel: () => $(!1),
            onSubmitField: (D, R, H, E) => {
              L(D, [...R, H], E);
            }
          }
        ) }) }),
        f ? null : /* @__PURE__ */ o("button", { type: "button", onClick: () => $(!0), className: S(b.skeleton, b.itemHover, "mt-2"), children: [
          /* @__PURE__ */ t("span", { children: "Add JSON or edit data" }),
          /* @__PURE__ */ t("span", { className: b.badge, children: "+" })
        ] })
      ] })
    ] })
  ] });
}
const he = {
  wrapper: "grid h-full min-h-0 grid-cols-[3fr_3fr_4fr] gap-4 overflow-x-hidden",
  column: "h-full min-h-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-[columnIn_240ms_ease]"
};
function Ot({
  columns: e,
  collections: n,
  activeCollection: d,
  documents: a,
  activeDocumentId: w,
  highlight: u,
  checkValidReference: x,
  onSelectCollection: N,
  onSelectDocument: g,
  onRemoveDocument: m,
  onOpenJsonPath: M,
  onUpdateJsonValue: p,
  onAddDocument: L,
  onAddCollection: f,
  onOpenManager: $
}) {
  const q = e.slice(-3);
  return /* @__PURE__ */ t("div", { className: he.wrapper, children: q.map((k, A) => {
    const D = A === 0;
    return k.type === "collections" ? /* @__PURE__ */ t("div", { className: he.column, children: /* @__PURE__ */ t(
      kt,
      {
        collections: n,
        activeCollection: d,
        onSelectCollection: N,
        onOpenManager: $,
        onAddCollection: f
      }
    ) }, k.id) : k.type === "documents" ? /* @__PURE__ */ t("div", { className: he.column, children: /* @__PURE__ */ t(
      St,
      {
        documents: a,
        activeDocumentId: w,
        onSelectDocument: g,
        onRemoveDocument: m,
        onOpenManager: $,
        onAddDocument: L
      }
    ) }, k.id) : /* @__PURE__ */ t("div", { className: he.column, children: /* @__PURE__ */ t(
      Dt,
      {
        title: k.title,
        value: k.value,
        path: k.path,
        rootDocumentId: k.rootDocumentId,
        columnDepth: k.depth,
        highlight: u,
        allowPrimitiveClick: D,
        isReferenceColumn: k.isReferenceColumn,
        activeSegment: k.activeSegment ?? null,
        checkValidReference: x,
        onOpenManager: $,
        onOpenPath: M,
        onUpdateValue: p
      }
    ) }, k.id);
  }) });
}
const _ = {
  wrapper: "fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3",
  toggle: "rounded-full border border-emerald-500/50 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)] transition hover:scale-[1.02]",
  panel: "w-[360px] max-w-[90vw] rounded-[16px] border border-slate-200 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur",
  section: "rounded-[12px] border border-slate-200 bg-slate-50 p-3",
  sectionTitle: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500",
  input: "flex-1 rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400/60 focus:outline-none",
  chip: "rounded-l-full border px-3 pr-2 py-1 text-xs transition",
  chipActive: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  chipInactive: "border-slate-200 bg-white text-slate-600 hover:border-emerald-400/40 hover:text-emerald-700",
  action: "rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:scale-[1.02]",
  panelHeader: "mb-4 flex items-center justify-between",
  panelTitle: "text-sm font-semibold text-slate-900",
  panelSubtitle: "text-xs text-slate-500",
  liveBadge: "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700",
  scrollArea: "max-h-[70vh] space-y-4 overflow-y-auto pr-1",
  scopeRow: "mt-2 flex items-center gap-2 text-xs text-slate-600",
  scopePill: "rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600",
  exportBtn: "rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs",
  textarea: "h-48 w-full resize-y rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
};
function $t({
  isOpen: e,
  onToggle: n,
  catalogs: d,
  activeDatabase: a,
  activeCollection: w,
  activeDocument: u,
  onSelectDatabase: x,
  onSelectCollection: N,
  onAddDatabase: g,
  onRemoveDatabase: m,
  onAddCollection: M,
  onRemoveCollection: p,
  documents: L,
  onImportJson: f
}) {
  const [$, q] = j(""), [k, A] = j(""), [D, R] = j(""), H = Y(
    () => d.find((I) => I.database === a),
    [d, a]
  ), E = u ? ie(u._id) : null, K = E ? `Document ${E.slice(-6)}` : w ? `Collection ${w}` : "No selection";
  return /* @__PURE__ */ o("div", { className: _.wrapper, children: [
    /* @__PURE__ */ t("button", { type: "button", onClick: n, className: _.toggle, children: e ? "Hide manager" : "Open manager" }),
    e ? /* @__PURE__ */ o("div", { className: _.panel, children: [
      /* @__PURE__ */ o("div", { className: _.panelHeader, children: [
        /* @__PURE__ */ o("div", { children: [
          /* @__PURE__ */ t("div", { className: _.panelTitle, children: "Floating Data Manager" }),
          /* @__PURE__ */ t("div", { className: _.panelSubtitle, children: "Inject JSON and edit mock documents." })
        ] }),
        /* @__PURE__ */ t("span", { className: _.liveBadge, children: "Live" })
      ] }),
      /* @__PURE__ */ o("div", { className: _.scrollArea, children: [
        /* @__PURE__ */ o("div", { className: _.section, children: [
          /* @__PURE__ */ t("div", { className: _.sectionTitle, children: "Database" }),
          /* @__PURE__ */ t("div", { className: "mt-2 flex flex-wrap gap-1", children: d.map((I) => /* @__PURE__ */ o("div", { className: "flex gap-0.5", children: [
            /* @__PURE__ */ o(
              "button",
              {
                type: "button",
                onClick: () => x(I.database),
                className: S(
                  _.chip,
                  "rounded-l-full",
                  a === I.database ? _.chipActive : _.chipInactive
                ),
                children: [
                  /* @__PURE__ */ t(De, { className: "mr-1 inline h-3 w-3" }),
                  I.database
                ]
              }
            ),
            /* @__PURE__ */ t(
              "button",
              {
                type: "button",
                onClick: () => m(I.database),
                className: "rounded-r-full border border-slate-200 bg-white px-2 pl-1.5 text-xs text-slate-600 transition hover:border-emerald-400/40 hover:text-emerald-700",
                children: /* @__PURE__ */ t(Re, { className: "h-3 w-3" })
              }
            )
          ] }, I.database)) }),
          /* @__PURE__ */ o("div", { className: "mt-3 flex gap-2", children: [
            /* @__PURE__ */ t(
              "input",
              {
                value: $,
                onChange: (I) => q(I.target.value),
                placeholder: "new-database",
                className: _.input,
                onKeyDown: (I) => {
                  I.key === "Enter" && (g($), q(""));
                }
              }
            ),
            /* @__PURE__ */ o(
              "button",
              {
                type: "button",
                className: _.action,
                onClick: () => {
                  g($), q("");
                },
                children: [
                  /* @__PURE__ */ t(ve, { className: "mr-1 inline h-3 w-3" }),
                  "Add"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ o("div", { className: _.section, children: [
          /* @__PURE__ */ t("div", { className: _.sectionTitle, children: "Collections" }),
          /* @__PURE__ */ t("div", { className: "mt-2 flex flex-wrap gap-2", children: H == null ? void 0 : H.collections.map((I) => /* @__PURE__ */ o("div", { className: "flex gap-0.5", children: [
            /* @__PURE__ */ t(
              "button",
              {
                type: "button",
                onClick: () => N(I.collection.name),
                className: S(
                  _.chip,
                  w === I.collection.name ? _.chipActive : _.chipInactive
                ),
                children: I.collection.name
              }
            ),
            /* @__PURE__ */ t(
              "button",
              {
                type: "button",
                onClick: () => p(a ?? "", I.collection.name),
                className: "rounded-r-full border border-slate-200 bg-white px-2 pl-1.5 text-xs text-slate-600 transition hover:border-emerald-400/40 hover:text-emerald-700",
                children: /* @__PURE__ */ t(Re, { className: "h-3 w-3" })
              }
            )
          ] }, I.collection.name)) }),
          /* @__PURE__ */ o("div", { className: "mt-3 flex gap-2", children: [
            /* @__PURE__ */ t(
              "input",
              {
                value: k,
                onChange: (I) => A(I.target.value),
                placeholder: "new-collection",
                className: _.input,
                onKeyDown: (I) => {
                  I.key === "Enter" && a && (M(a, k), A(""));
                }
              }
            ),
            /* @__PURE__ */ o(
              "button",
              {
                type: "button",
                className: _.action,
                onClick: () => {
                  a && (M(a, k), A(""));
                },
                children: [
                  /* @__PURE__ */ t(ve, { className: "mr-1 inline h-3 w-3" }),
                  "Add"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ o("div", { className: _.section, children: [
          /* @__PURE__ */ o("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ t("div", { className: _.sectionTitle, children: "Import / Export" }),
            /* @__PURE__ */ t("div", { className: "text-xs text-slate-500", children: "Paste large JSON here" })
          ] }),
          /* @__PURE__ */ o("div", { className: _.scopeRow, children: [
            /* @__PURE__ */ t("span", { children: "Scope" }),
            /* @__PURE__ */ t("span", { className: _.scopePill, children: K })
          ] }),
          /* @__PURE__ */ o("div", { className: "mt-2", children: [
            /* @__PURE__ */ t("textarea", { value: D, onChange: (I) => R(I.target.value), placeholder: "Paste JSON array or object here", className: _.textarea }),
            /* @__PURE__ */ o("div", { className: "mt-2 flex gap-2", children: [
              /* @__PURE__ */ t("button", { type: "button", onClick: () => {
                f(D, E);
              }, className: _.action, children: "Import JSON" }),
              /* @__PURE__ */ t(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (u) {
                      R(JSON.stringify(u, null, 2));
                      return;
                    }
                    R(JSON.stringify(L ?? [], null, 2));
                  },
                  className: _.exportBtn,
                  children: "Export current"
                }
              )
            ] }),
            /* @__PURE__ */ t("div", { className: "mt-2 text-[11px] text-slate-400", children: "Tip: Importing an array will add multiple documents." })
          ] })
        ] })
      ] })
    ] }) : null
  ] });
}
const qe = `{
  "title": "new document"
}`, W = (e) => ie(e._id) ?? "", ue = (e) => {
  const n = "_id" in e ? e._id : void 0;
  return n && ie(n) ? e : { ...e, _id: _e(Ae()) };
}, xe = (e, n, d) => ({
  status: "ok",
  data: n,
  meta: {
    collection: e,
    range: { type: "all" },
    executedAt: Date.now(),
    durationMs: 0
  },
  total: d
}), U = (e, n) => e && n ? `${e}::${n}` : null, Je = (e) => !!e && typeof e == "object" && !Array.isArray(e), Jt = (e, n) => {
  let d = e;
  for (const a of n) {
    if (a.type === "reference") return d;
    if (a.type === "key") {
      if (!Je(d)) return;
      d = d[a.key];
    }
    if (a.type === "index") {
      if (!Array.isArray(d)) return;
      d = d[a.index];
    }
  }
  return d;
}, Me = (e, n, d) => {
  if (n.length === 0) return d;
  const [a, ...w] = n;
  if (a.type === "reference") return e;
  if (a.type === "key") {
    const x = Je(e) ? { ...e } : {};
    return x[a.key] = w.length === 0 ? d : Me(x[a.key], w, d), x;
  }
  const u = Array.isArray(e) ? [...e] : [];
  return u[a.index] = w.length === 0 ? d : Me(u[a.index], w, d), u;
};
function Tt(e = {}) {
  var Te, Le;
  const n = e.defaultCollection ?? (e.queryResult && "meta" in e.queryResult ? e.queryResult.meta.collection : null), d = e.defaultDatabase ?? ((Le = (Te = e.catalogs) == null ? void 0 : Te[0]) == null ? void 0 : Le.database) ?? null, [a, w] = j(e.catalogs ?? []), [u, x] = j(
    e.queryResult ?? null
  ), [N, g] = j(
    e.seedQueryByCollection ?? {}
  ), [m, M] = j(d), [p, L] = j(n), [f, $] = j(
    e.defaultDocumentId ?? null
  ), [q, k] = j(0), [A, D] = j([qe]), [R, H] = j([]), [E, K] = j([]), [I, Z] = j({
    rootId: null,
    pathKey: null,
    timestamp: 0
  });
  oe(() => {
    !m && a.length > 0 && M(a[0].database);
  }, [m, a]), oe(() => {
    const r = U(m, p);
    r && N[r] && x(N[r]);
  }, [p, m, N]);
  const se = Y(() => {
    if (!p) return null;
    const r = a.find((l) => l.database === m) ?? a[0];
    return (r == null ? void 0 : r.collections.find((l) => l.collection.name === p)) ?? null;
  }, [p, m, a]), Q = Y(() => !u || u.status === "empty" ? [] : u.status === "ok" || u.status === "partial" ? u.data : [], [u]), X = Y(() => {
    const r = /* @__PURE__ */ new Map(), l = (c) => {
      !c || c.status !== "ok" && c.status !== "partial" || c.data.forEach((s) => {
        const i = W(s);
        i && r.set(i, s);
      });
    };
    return Object.values(N).forEach(l), l(u), r;
  }, [N, u]), le = Y(() => {
    const r = /* @__PURE__ */ new Map();
    return Q.forEach((l) => {
      const c = W(l);
      c && r.set(c, l);
    }), r;
  }, [Q]), re = Y(() => f ? Q.find((r) => W(r) === f) ?? null : null, [f, Q]), ee = Y(() => p ? {
    collection: p,
    timeWindow: { type: "last", amount: 6, unit: "hours" },
    filters: []
  } : null, [p]);
  oe(() => {
    !ee || !e.onWatch || e.onWatch({
      sessionId: "explorer-preview",
      collection: ee.collection,
      scope: ee,
      throttleMs: 250
    });
  }, [e, ee]), oe(() => {
    if (!I.timestamp) return;
    const r = window.setTimeout(() => {
      Z({ rootId: null, pathKey: null, timestamp: 0 });
    }, 1200);
    return () => window.clearTimeout(r);
  }, [I.timestamp]), oe(() => {
    f || K([]);
  }, [f]);
  const ce = P((r) => {
    M(r), L(null), $(null), k(0), K([]), x(null);
  }, []), de = P(
    (r) => {
      L(r), $(null), k(1), K([]);
      const l = U(m, r);
      l && N[l] ? x(N[l]) : x(null);
    },
    [m, N]
  ), we = P((r) => {
    const l = W(r);
    $(l || null), k(2), K([]);
  }, []), Ne = P((r, l, c) => {
    K((s) => [...s.slice(0, r), c ? s[r] : l]);
  }, [E]), ke = P((r) => {
    K((l) => l.slice(0, Math.max(0, r)));
  }, []), Ce = P((r) => {
    const l = r.trim();
    l && w((c) => c.some((s) => s.database === l) ? c : [
      ...c,
      {
        database: l,
        status: { state: "unknown", reason: "local" },
        collections: [],
        fetchedAt: Date.now()
      }
    ]);
  }, []), h = P(
    (r) => {
      w((l) => {
        var s;
        const c = l.filter((i) => i.database !== r);
        return m === r && (M(((s = c[0]) == null ? void 0 : s.database) ?? null), L(null), $(null)), c;
      });
    },
    [m]
  ), G = P((r, l) => {
    const c = l.trim();
    c && w(
      (s) => s.map((i) => i.database !== r || i.collections.some((y) => y.collection.name === c) ? i : {
        ...i,
        collections: [
          ...i.collections,
          {
            collection: {
              name: c,
              documentCount: 0,
              sizeMb: 0,
              indexCount: 0,
              hasChangeStreamSupport: !0
            },
            indexes: []
          }
        ]
      })
    );
  }, []), J = P(
    (r, l) => {
      w(
        (c) => c.map(
          (s) => s.database !== r ? s : { ...s, collections: s.collections.filter((i) => i.collection.name !== l) }
        )
      ), p === l && (L(null), $(null), k(0));
    },
    [p]
  ), ae = P(
    (r) => {
      x((l) => {
        if (!l || l.status !== "ok" && l.status !== "partial") return l;
        const c = l.data.filter((v) => W(v) !== r), s = "total" in l && typeof l.total == "number" ? Math.max(l.total - 1, 0) : c.length, i = l.status === "partial" ? { ...l, data: c } : { ...l, data: c, total: s }, y = U(m, p);
        return y && g((v) => ({ ...v, [y]: i })), i;
      }), f === r && $(null);
    },
    [p, m, f]
  ), Ie = P(() => {
    D((r) => [...r, qe]);
  }, []), Qe = P((r, l) => {
    D((c) => c.map((s, i) => i === r ? l : s));
  }, []), Ue = P((r) => {
    D((l) => l.filter((c, s) => s !== r)), H((l) => l.filter((c, s) => s !== r));
  }, []), Xe = P(async () => {
    var s;
    if (!p) return;
    const r = [], l = [];
    if (A.forEach((i, y) => {
      try {
        const v = JSON.parse(i);
        Array.isArray(v) ? v.forEach((T) => {
          T && typeof T == "object" && r.push(ue(T));
        }) : v && typeof v == "object" && r.push(ue(v)), l[y] = "";
      } catch (v) {
        l[y] = v instanceof Error ? v.message : "Invalid JSON";
      }
    }), H(l), r.length === 0) return;
    x((i) => {
      if (!i || i.status === "empty") {
        const y = xe(p, r, r.length), v = U(m, p);
        return v && g((T) => ({ ...T, [v]: y })), y;
      }
      if (i.status === "ok" || i.status === "partial") {
        const y = [...i.data];
        let v = 0;
        r.forEach((te) => {
          const pe = W(te), fe = y.findIndex((rt) => W(rt) === pe);
          fe >= 0 ? y[fe] = te : (y.unshift(te), v += 1);
        });
        const T = "total" in i && typeof i.total == "number" ? i.total + v : y.length, V = i.status === "partial" ? { ...i, data: y } : { ...i, data: y, total: T }, F = U(m, p);
        return F && g((te) => ({ ...te, [F]: V })), V;
      }
      return i;
    });
    const c = r.map(W).filter(Boolean);
    f && c.includes(f) && Z({
      rootId: f,
      pathKey: je,
      timestamp: Date.now()
    }), await ((s = e.onInsertDocuments) == null ? void 0 : s.call(e, p, r));
  }, [p, A, e]), Ge = P((r) => X.get(r) ?? null, [X]), Ye = P((r) => {
    const l = ue(r);
    x((c) => {
      if (!c || c.status === "empty") {
        const s = xe(p ?? "unknown", [l], 1), i = U(m, p);
        return i && g((y) => ({ ...y, [i]: s })), s;
      }
      if (c.status === "ok" || c.status === "partial") {
        const s = [...c.data], i = W(l), y = s.findIndex((F) => W(F) === i);
        y >= 0 ? s[y] = l : s.unshift(l);
        const v = "total" in c && typeof c.total == "number" ? c.total + (y >= 0 ? 0 : 1) : s.length, T = c.status === "partial" ? { ...c, data: s } : { ...c, data: s, total: v }, V = U(m, p);
        return V && g((F) => ({ ...F, [V]: T })), T;
      }
      return c;
    });
  }, [p, m]), et = P((r) => {
    if (!p) return;
    let l;
    try {
      l = JSON.parse(r);
    } catch {
      return;
    }
    const c = [];
    Array.isArray(l) ? l.forEach((s) => {
      s && typeof s == "object" && c.push(ue(s));
    }) : l && typeof l == "object" && c.push(ue(l)), c.length !== 0 && x((s) => {
      if (!s || s.status === "empty") {
        const i = xe(p, c, c.length), y = U(m, p);
        return y && g((v) => ({ ...v, [y]: i })), i;
      }
      if (s.status === "ok" || s.status === "partial") {
        const i = [...s.data];
        let y = 0;
        c.forEach((F) => {
          const te = W(F), pe = i.findIndex((fe) => W(fe) === te);
          pe >= 0 ? i[pe] = F : (i.unshift(F), y += 1);
        });
        const v = "total" in s && typeof s.total == "number" ? s.total + y : i.length, T = s.status === "partial" ? { ...s, data: i } : { ...s, data: i, total: v }, V = U(m, p);
        return V && g((F) => ({ ...F, [V]: T })), T;
      }
      return s;
    });
  }, [p, m]), tt = P(
    (r) => {
      x((l) => {
        if (r.type === "replace") {
          const c = xe(p ?? "unknown", r.data, r.data.length), s = U(m, p ?? null);
          return s && g((i) => ({ ...i, [s]: c })), c;
        }
        if (!l || l.status === "empty") return l;
        if (r.type === "patch" && (l.status === "ok" || l.status === "partial")) {
          const c = l.data.map((y) => {
            if (W(y) !== f) return y;
            const v = { ...y };
            return r.patch.forEach((T) => {
              T.op === "removed" && delete v[T.field], (T.op === "added" || T.op === "updated") && (v[T.field] = T.newValue);
            }), v;
          }), s = { ...l, data: c }, i = U(m, p);
          return i && g((y) => ({ ...y, [i]: s })), s;
        }
        return l;
      }), f && Z({
        rootId: f,
        pathKey: je,
        timestamp: Date.now()
      });
    },
    [p, m, f]
  ), at = P((r, l, c) => {
    const s = l.filter((i) => i.type !== "reference");
    !r || s.length === 0 || (x((i) => {
      if (!i || i.status !== "ok" && i.status !== "partial") return i;
      const y = i.data.map((V) => {
        if (W(V) !== r) return V;
        const te = Me(V, s, c);
        return Je(te) ? te : V;
      }), v = i.status === "partial" ? { ...i, data: y } : { ...i, data: y, total: i.total ?? y.length }, T = U(m, p);
      return T && g((V) => ({ ...V, [T]: v })), v;
    }), Z({ rootId: r, pathKey: me(s), timestamp: Date.now() }));
  }, [p, m]), nt = Y(() => {
    const r = [
      { id: "collections", type: "collections", title: "Collections" },
      { id: "documents", type: "documents", title: "Documents" },
      {
        id: `json-root-${f ?? "empty"}`,
        type: "json",
        title: "Document Root",
        value: re,
        path: [],
        rootDocumentId: f,
        depth: 0,
        isReferenceColumn: !1,
        activeSegment: E[0] ?? null
      }
    ];
    if (!re) return r;
    let l = re, c = f, s = [], i = 0;
    const y = [];
    return E.forEach((v) => {
      if (i += 1, v.type === "reference") {
        c = v.id, l = X.get(v.id) ?? null, s = [], y.push({
          id: `json-ref-${v.id}-${i}`,
          type: "json",
          title: `Document ${v.id.slice(-4)}`,
          value: l,
          path: s,
          rootDocumentId: c,
          depth: i,
          isReferenceColumn: !0,
          activeSegment: E[i] ?? null
        });
        return;
      }
      s = [...s, v], l = Jt(l, [v]);
      const T = v.type === "key" ? v.key : `[${v.index}]`;
      y.push({
        id: `json-${me(s)}-${i}`,
        type: "json",
        title: T,
        value: l,
        path: s,
        rootDocumentId: c,
        depth: i,
        isReferenceColumn: !1,
        activeSegment: E[i] ?? null
      });
    }), [...r, ...y];
  }, [re, f, le, E]), lt = Y(() => E.map(At), [E]);
  return {
    catalogs: a,
    activeDatabase: m,
    activeCollection: p,
    activeCollectionEntry: se,
    queryResult: u,
    documents: Q,
    documentMap: le,
    activeDocument: re,
    activePanel: q,
    viewScope: ee,
    columns: nt,
    jsonPath: E,
    breadcrumbSegments: lt,
    highlight: I,
    jsonInputs: A,
    jsonErrors: R,
    selectDatabase: ce,
    selectCollection: de,
    selectDocument: we,
    setActivePanel: k,
    openJsonPath: Ne,
    setJsonPathDepth: ke,
    updateJsonValue: at,
    addDatabase: Ce,
    removeDatabase: h,
    addCollection: G,
    removeCollection: J,
    removeDocumentById: ae,
    addJsonInput: Ie,
    updateJsonInput: Qe,
    removeJsonInput: Ue,
    submitJsonInputs: Xe,
    applyChangeResponse: tt,
    setQueryResult: x,
    addDocument: Ye,
    importJsonText: et,
    checkValidReference: Ge
  };
}
const ye = {
  page: "h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] text-slate-900",
  container: "flex h-full flex-col gap-4 px-6 py-6",
  viewport: "flex-1 overflow-hidden rounded-[18px] border border-slate-200 bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur",
  viewportInner: "flex h-full flex-col gap-4"
}, Lt = [
  {
    database: "campus-live",
    status: { state: "primary", oplogSizeMb: 512, lagMs: 0 },
    fetchedAt: Date.now(),
    collections: [
      {
        collection: {
          name: "events",
          documentCount: 156,
          sizeMb: 38,
          indexCount: 2,
          hasChangeStreamSupport: !0
        },
        indexes: []
      },
      {
        collection: {
          name: "users",
          documentCount: 84,
          sizeMb: 14,
          indexCount: 2,
          hasChangeStreamSupport: !0
        },
        indexes: []
      },
      {
        collection: {
          name: "clubs",
          documentCount: 52,
          sizeMb: 9,
          indexCount: 3,
          hasChangeStreamSupport: !0
        },
        indexes: []
      }
    ]
  },
  {
    database: "side-hustle",
    status: { state: "secondary", oplogSizeMb: 256, lagMs: 124 },
    fetchedAt: Date.now(),
    collections: [
      {
        collection: {
          name: "ideas",
          documentCount: 18,
          sizeMb: 3,
          indexCount: 1,
          hasChangeStreamSupport: !0
        },
        indexes: []
      },
      {
        collection: {
          name: "orders",
          documentCount: 32,
          sizeMb: 6,
          indexCount: 2,
          hasChangeStreamSupport: !0
        },
        indexes: []
      },
      {
        collection: {
          name: "products",
          documentCount: 18,
          sizeMb: 4,
          indexCount: 1,
          hasChangeStreamSupport: !0
        },
        indexes: []
      }
    ]
  }
], Rt = {
  "campus-live::events": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439a5f001" },
        title: "Kickoff update",
        author: "Jina",
        status: "live",
        score: 92,
        owner: { id: "u-102", name: "Jina Kim", profile: { major: "CS", year: 3 } },
        tags: ["campus", "stream", "realtime"],
        metrics: { engagement: { day: 3, week: 12 } }
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439a5f002" },
        title: "Realtime demo",
        author: "Marco",
        status: "draft",
        score: 76,
        draft: {
          sections: [
            { title: "overview", blocks: [{ type: "text", value: "First draft notes." }] },
            { title: "metrics", blocks: [{ type: "chart", value: { kind: "line", points: [1, 4, 9, 7] } }] }
          ]
        },
        refs: { primary: { $oid: "664efb9ea1c0c9b439a5f003" }, siblings: [{ $oid: "664efb9ea1c0c9b439a5f001" }] }
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439a5f003" },
        title: "Campus hackathon",
        author: "Yuna",
        status: "hot",
        score: 88,
        schedule: {
          stages: [
            { label: "Registration", slots: 120 },
            { label: "Mentoring", slots: 20 },
            { label: "Pitch", slots: 10 }
          ],
          window: { from: 171645e7, to: 17165364e5 }
        }
      }
    ],
    meta: {
      collection: "events",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 42
    },
    total: 3
  },
  "campus-live::clubs": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439a6c201" },
        name: "Robotics Lab",
        lead: { name: "Hana", year: 4 },
        members: 28,
        focus: ["automation", "hardware"],
        socials: { instagram: "@robotlab", discord: "robotics-lab" }
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439a6c202" },
        name: "Fintech Society",
        lead: { name: "Minho", year: 3 },
        members: 42,
        activeProjects: ["ledger", "analytics"],
        contacts: { email: "fintech@campus.live", office: "B-402" }
      }
    ],
    meta: {
      collection: "clubs",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 33
    },
    total: 2
  },
  "campus-live::users": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439a7d501" },
        name: "Sora Park",
        role: "organizer",
        profile: { major: "Design", year: 2, timezone: "Asia/Seoul" },
        socials: { github: "sora-park", twitter: "@sora" }
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439a7d502" },
        name: "Leo Kang",
        role: "mentor",
        profile: { major: "Robotics", year: 4, timezone: "Asia/Seoul" },
        stats: { sessions: 12, rating: 4.8 }
      }
    ],
    meta: {
      collection: "users",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 31
    },
    total: 2
  },
  "side-hustle::ideas": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439b1d301" },
        title: "AI tutor micro-saas",
        stage: "validate",
        target: { region: "apac", segment: "students" },
        pricing: { monthly: 9, yearly: 90 },
        owners: ["u-201", "u-204"]
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439b1d302" },
        title: "Local events radar",
        stage: "prototype",
        target: { region: "us", segment: "creators" },
        traction: { waitlist: 140, newsletters: 3 },
        owners: ["u-203"]
      }
    ],
    meta: {
      collection: "ideas",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 27
    },
    total: 2
  },
  "side-hustle::orders": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439b2e401" },
        customer: { id: "u-301", name: "Alex" },
        items: [
          { sku: "wireless-mic", qty: 1, price: 129 },
          { sku: "audio-kit", qty: 2, price: 49 }
        ],
        status: "packing",
        delivery: { etaDays: 2, carrier: "FastShip" },
        productRefs: [{ $oid: "664efb9ea1c0c9b439b3f501" }]
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439b2e402" },
        customer: { id: "u-309", name: "Chloe" },
        items: [{ sku: "studio-light", qty: 1, price: 89 }],
        status: "delivered",
        delivery: { etaDays: 0, carrier: "FastShip" },
        productRefs: [{ $oid: "664efb9ea1c0c9b439b3f502" }]
      }
    ],
    meta: {
      collection: "orders",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 29
    },
    total: 2
  },
  "side-hustle::products": {
    status: "ok",
    data: [
      {
        _id: { $oid: "664efb9ea1c0c9b439b3f501" },
        name: "Wireless Mic",
        category: "audio",
        price: 129,
        stock: { available: 52, reserved: 4 },
        tags: ["creator", "portable"]
      },
      {
        _id: { $oid: "664efb9ea1c0c9b439b3f502" },
        name: "Studio Light",
        category: "lighting",
        price: 89,
        stock: { available: 18, reserved: 1 },
        tags: ["studio", "budget"]
      }
    ],
    meta: {
      collection: "products",
      range: { type: "all" },
      executedAt: Date.now(),
      durationMs: 26
    },
    total: 2
  }
}, Et = (e) => e ? ie(e._id) : null;
function zt({ catalogs: e = Lt, queryResult: n, className: d }) {
  const a = Tt({ catalogs: e, queryResult: n, seedQueryByCollection: Rt }), [w, u] = j(!0), x = Y(
    () => {
      var g;
      return ((g = a.catalogs.find((m) => m.database === a.activeDatabase)) == null ? void 0 : g.collections) ?? [];
    },
    [a.catalogs, a.activeDatabase]
  ), N = Et(a.activeDocument);
  return /* @__PURE__ */ o("div", { className: S(ye.page, d), children: [
    /* @__PURE__ */ o("div", { className: ye.container, children: [
      /* @__PURE__ */ t(
        wt,
        {
          catalogs: a.catalogs,
          activeDatabase: a.activeDatabase,
          onSelectDatabase: a.selectDatabase
        }
      ),
      /* @__PURE__ */ t("main", { className: ye.viewport, children: /* @__PURE__ */ o("div", { className: ye.viewportInner, children: [
        /* @__PURE__ */ t(
          Nt,
          {
            activeDatabase: a.activeDatabase,
            activeCollection: a.activeCollection,
            activeDocumentId: N,
            pathSegments: a.breadcrumbSegments,
            onSelectPathDepth: a.setJsonPathDepth
          }
        ),
        /* @__PURE__ */ t("div", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ t(
          Ot,
          {
            columns: a.columns,
            collections: x,
            activeCollection: a.activeCollection,
            documents: a.documents,
            activeDocumentId: N,
            highlight: a.highlight,
            checkValidReference: a.checkValidReference,
            onSelectCollection: a.selectCollection,
            onSelectDocument: a.selectDocument,
            onRemoveDocument: a.removeDocumentById,
            onOpenJsonPath: a.openJsonPath,
            onUpdateJsonValue: a.updateJsonValue,
            onAddDocument: a.addDocument,
            onAddCollection: (g) => {
              a.activeDatabase && a.addCollection(a.activeDatabase, g);
            },
            onOpenManager: () => u(!0)
          }
        ) })
      ] }) })
    ] }),
    /* @__PURE__ */ t(
      $t,
      {
        isOpen: w,
        onToggle: () => u((g) => !g),
        catalogs: a.catalogs,
        activeDatabase: a.activeDatabase,
        activeCollection: a.activeCollection,
        activeDocument: a.activeDocument,
        documents: a.documents,
        onSelectDatabase: a.selectDatabase,
        onSelectCollection: a.selectCollection,
        onAddDatabase: a.addDatabase,
        onRemoveDatabase: a.removeDatabase,
        onAddCollection: a.addCollection,
        onRemoveCollection: a.removeCollection,
        onImportJson: a.importJsonText
      }
    )
  ] });
}
export {
  zt as ExplorerPage,
  Tt as useExplorerState
};
