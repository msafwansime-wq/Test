const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/root/.claude/skills/synced/20d606dc-5fb7-4cee-a597-ae07de1e1341_b405416f-6f1e-49be-9c53-16c6b61fbb5f/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "Proton_eMAS_Merchandise_Proposal.pptx";

const THEME = {
  name: "eMAS Volt",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B1E2D", lt1: "FFFFFF", dk2: "3A4B5C", lt2: "EEF3F6",
    accent1: "00A99D", accent2: "0B1E2D", accent3: "9BD33A", accent4: "F2A93B",
    accent5: "E2574C", accent6: "6B7C8F", hlink: "00A99D", folHlink: "6B7C8F",
  },
};
const H = THEME.colors; // hex, for hex-only options

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Proton eMAS Merchandise Development Proposal";
pres.author = "Merchandise Development Team";
const C = pres.SchemeColor;

const W = 13.333;
const FOOT = "Proton eMAS Merchandise Development  |  Proposal draft for discussion";

// ---------- icons ----------
async function icon(name, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(fa[name], { color: "#" + color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 2.2, w: 9.5, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 4.2, w: 9.5, h: 1.2, fontSize: 18, color: C.accent1, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.5, 0.6, 0.5],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.35, w: 12.3, h: 0.75, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.5, y: 1.1, w: 12.3, h: 0.4, fontSize: 15, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.5, y: 7.05, w: 9, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
});

let n = 0;
function content(section, title, sub) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  if (sub) s.addText(sub, { placeholder: "body" });
  return s;
}
const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 });
function card(s, x, y, w, h, fill, name) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill || C.background2 }, line: { type: "none" }, objectName: name });
}
async function iconCircle(s, x, y, d, iconName, bg, fg, name) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" }, objectName: name + " circle" });
  const p = d * 0.24;
  s.addImage({ data: await icon(iconName, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: name, objectName: name + " icon" });
}
const tx = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontSize: 14, color: C.text2, valign: "top" }, o));

(async () => {
  // ================= 1. TITLE =================
  pres.addSection({ title: "Introduction" });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Introduction" });
    s.addText("Proton eMAS Merchandise Development", { placeholder: "title" });
    s.addText("Range, pricing, launch plan and strategy  |  Proposal, November 2026", { placeholder: "body" });
    await iconCircle(s, 10.6, 2.5, 2.0, "FaBolt", C.accent1, H.lt1, "Electric bolt motif");
    tx(s, "Drive electric. Live electric.", { x: 0.7, y: 6.3, w: 8, h: 0.4, fontSize: 14, italic: true, color: C.background2 });
    s.addNotes("Purpose: secure approval for the eMAS merchandise range, pricing architecture and launch plan. All prices, costs and volumes are planning estimates to be validated through RFQ and a store audit.");
  }

  // ================= 2. EXEC SUMMARY =================
  {
    const s = content("Introduction", "Executive summary", "A two-audience merchandise programme that builds the eMAS community and pays for itself");
    const items = [
      ["FaBullseye", "Opportunity", "Merchandise turns eMAS buyers into visible brand advocates and gives sales advisors a premium, EV-native image."],
      ["FaTags", "Range", "32 SKUs across 7 categories: a 14-SKU hero range for owners and a 9-item toolkit for sales advisors."],
      ["FaChartLine", "Commercials", "Accessible-premium pricing at RM15 to RM399, below BYD and far below Tesla. Target blended gross margin about 45%."],
      ["FaRocket", "Launch", "Soft launch 1 Mar 2027 in eMAS showrooms; full launch with e-shop and marketplaces on 1 Jun 2027."],
    ];
    const cw = 2.85, gap = 0.3, y = 1.85;
    for (let i = 0; i < 4; i++) {
      const x = 0.5 + i * (cw + gap);
      card(s, x, y, cw, 4.7, C.background2, items[i][1] + " card");
      await iconCircle(s, x + 0.3, y + 0.35, 0.8, items[i][0], C.accent1, H.lt1, items[i][1]);
      tx(s, items[i][1], { x: x + 0.3, y: y + 1.4, w: cw - 0.6, h: 0.45, fontSize: 20, bold: true, color: C.text1 });
      tx(s, items[i][2], { x: x + 0.3, y: y + 1.95, w: cw - 0.6, h: 2.5, fontSize: 15 });
    }
    s.addNotes("Decisions requested today: approve the hero range, the pricing architecture and the launch timeline.");
  }

  // ================= 3. PERSONAS =================
  pres.addSection({ title: "Range and pricing" });
  {
    const s = content("Range and pricing", "Who we are designing for", "Three target groups with distinct needs shape the range");
    const P = [
      ["FaUserTie", "Sales advisor", "Internal / B2B", ["Professional, EV-native look on the floor", "Demo tools that explain charging simply", "Handover gifts that create a 'wow' moment", "Rewards that motivate sales targets"]],
      ["FaChargingStation", "EV tech owner", "Urban, 25 to 40", ["Wants smart, useful EV accessories", "Buys clean, minimalist apparel", "Shares on social media: design matters", "Shops online and on marketplaces"]],
      ["FaUsers", "Family EV buyer", "Suburban, 30 to 50", ["Values practical car-care items", "Buys gifts and kids' items", "Price-sensitive: likes bundles", "Visits showroom for service and events"]],
    ];
    const cw = 3.9, gap = 0.3, y = 1.8;
    for (let i = 0; i < 3; i++) {
      const x = 0.5 + i * (cw + gap);
      card(s, x, y, cw, 4.85, i === 0 ? C.text1 : C.background2, P[i][1] + " card");
      const dark = i === 0;
      await iconCircle(s, x + 0.35, y + 0.35, 0.9, P[i][0], dark ? C.accent1 : C.text1, H.lt1, P[i][1]);
      tx(s, P[i][1], { x: x + 1.45, y: y + 0.4, w: 2.3, h: 0.45, fontSize: 20, bold: true, color: dark ? C.background1 : C.text1 });
      tx(s, P[i][2], { x: x + 1.45, y: y + 0.85, w: 2.3, h: 0.35, fontSize: 13, color: C.accent1 });
      s.addText(P[i][3].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < 3 } })), {
        isTextBox: true, x: x + 0.35, y: y + 1.6, w: cw - 0.7, h: 3.0, fontSize: 15, color: dark ? C.background2 : C.text2, paraSpaceAfter: 10, valign: "top", margin: 0,
      });
    }
  }

  // ================= 4. TOP SELLERS =================
  {
    const s = content("Range and pricing", "Proposed top-selling merchandise", "Apparel, drinkware and key accessories should drive about 58% of unit volume");
    s.addChart(pres.charts.BAR, [{ name: "Share of units", labels: ["Apparel", "Drinkware", "Keychains & key tags", "EV & car accessories", "Collectible models", "Bags & travel", "Kids & gifting"], values: [24, 18, 16, 15, 10, 9, 8] }], {
      x: 0.5, y: 1.7, w: 6.2, h: 5.1, barDir: "bar", catAxisOrientation: "maxMin",
      showTitle: true, title: "Projected Year-1 unit mix (%)", titleFontSize: 14, titleColor: H.dk1, titleFontFace: "+mn-lt",
      chartColors: [H.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: H.dk2, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: '0"%"',
      catAxisLabelColor: H.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 60,
    });
    const hero = [
      ["FaMugHot", "Insulated tumbler 500ml", "RM59"],
      ["FaTshirt", "Eco tee (recycled PET)", "RM69"],
      ["FaKey", "NFC key tag", "RM39"],
      ["FaShoppingBag", "Charging-cable organiser bag", "RM89"],
      ["FaCarSide", "1:24 diecast eMAS 7", "RM199"],
      ["FaBolt", "Signature cap", "RM49"],
    ];
    tx(s, "Hero SKUs (proposed RRP)", { x: 7.2, y: 1.7, w: 5.6, h: 0.4, fontSize: 16, bold: true, color: C.text1 });
    for (let i = 0; i < hero.length; i++) {
      const y = 2.25 + i * 0.76;
      card(s, 7.2, y, 5.6, 0.64, C.background2, hero[i][1] + " row");
      await iconCircle(s, 7.32, y + 0.08, 0.48, hero[i][0], C.accent1, H.lt1, hero[i][1]);
      tx(s, hero[i][1], { x: 8.0, y, w: 3.4, h: 0.64, fontSize: 15, color: C.text1, valign: "middle" });
      tx(s, hero[i][2], { x: 11.4, y, w: 1.2, h: 0.64, fontSize: 16, bold: true, color: C.accent1, align: "right", valign: "middle" });
    }
    s.addNotes("Unit mix is benchmarked on typical automotive-brand merchandise sell-through; refine after the first 90 days of sales data.");
  }

  // ================= 5. PRICE RANGE =================
  {
    const s = content("Range and pricing", "Price range by category", "Three price tiers per category: entry for volume, core for margin, premium for brand image");
    const hdr = ["Category", "Entry (RM)", "Core (RM)", "Premium (RM)", "Example SKUs (entry / core / premium)"];
    const rows = [
      ["Apparel", "39", "69", "199", "Kids tee / eco tee / softshell jacket"],
      ["Drinkware", "25", "59", "99", "Mug / insulated tumbler / smart temp bottle"],
      ["Keychains & key tags", "15", "39", "79", "Rubber keychain / NFC key tag / leather key case"],
      ["EV & car accessories", "49", "89", "399", "Sunshade / cable organiser bag / 3D floor-mat set"],
      ["Collectible models", "59", "199", "399", "1:64 model / 1:24 diecast / 1:18 limited edition"],
      ["Bags & travel", "29", "89", "249", "Eco tote / sling bag / cabin trolley"],
      ["Kids & gifting", "19", "49", "99", "Sticker pack / plush mascot / gift box"],
    ];
    const head = hdr.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 14 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { fontSize: 14, color: j === 0 ? C.text1 : C.text2, bold: j === 0, align: j > 0 && j < 4 ? "center" : "left", fill: { color: i % 2 ? C.background1 : C.background2 } } })));
    s.addTable([head.map((c, j) => (j > 0 && j < 4 ? Object.assign(c, { options: Object.assign(c.options, { align: "center" }) }) : c)), ...body], {
      x: 0.5, y: 1.75, w: 12.3, colW: [2.6, 1.4, 1.4, 1.6, 5.3], rowH: 0.52, border: { type: "solid", pt: 0.5, color: "D5DEE5" }, valign: "middle", margin: [0.03, 0.1, 0.03, 0.1],
    });
    card(s, 0.5, 6.15, 12.3, 0.7, C.background2, "Price ladder note");
    tx(s, [{ text: "Price ladder rule: ", options: { bold: true, color: C.accent1 } }, { text: "keep about 60% of SKUs at or under RM69 so every showroom visitor has an impulse-buy option." }], { x: 0.75, y: 6.15, w: 11.8, h: 0.7, fontSize: 15, valign: "middle" });
  }

  // ================= 6. COMPETITORS =================
  {
    const s = content("Range and pricing", "Competitor price comparison", "eMAS is positioned as accessible premium: just under BYD, well below Tesla and Mercedes-Benz");
    const labels = ["Cap", "T-shirt", "Tumbler", "Keychain"];
    s.addChart(pres.charts.BAR, [
      { name: "eMAS (proposed)", labels, values: [49, 69, 59, 39] },
      { name: "Perodua", labels, values: [35, 45, 39, 20] },
      { name: "BYD", labels, values: [59, 79, 69, 35] },
      { name: "Honda", labels, values: [60, 89, 69, 39] },
      { name: "Tesla", labels, values: [155, 175, 190, 100] },
      { name: "Mercedes-Benz", labels, values: [200, 250, 200, 180] },
    ], {
      x: 0.5, y: 1.7, w: 8.3, h: 5.15, barDir: "col", barGrouping: "clustered", barGapWidthPct: 70,
      showTitle: true, title: "Indicative retail price (RM)", titleFontSize: 14, titleColor: H.dk1, titleFontFace: "+mn-lt",
      chartColors: [H.accent1, "B9C6D2", "8FA3B5", "6B7C8F", "3A4B5C", H.dk1],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 9, dataLabelColor: H.dk2, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: H.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt", valAxisLabelColor: H.dk2, valAxisLabelFontSize: 11, valAxisLabelFontFace: "+mn-lt",
      valGridLine: { color: "DDE4EA", size: 0.5 }, catGridLine: { style: "none" },
      showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: H.dk2, legendFontFace: "+mn-lt",
    });
    const pts = [
      ["Price index vs BYD", "~92", "eMAS core items average about 8% below BYD"],
      ["Price index vs Tesla", "~35", "Premium look at one third of the price"],
      ["Floor", "Perodua", "Stay above the mass-market floor to protect brand value"],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 1.75 + i * 1.7;
      card(s, 9.2, y, 3.6, 1.5, i === 0 ? C.text1 : C.background2, pts[i][0] + " callout");
      const dark = i === 0;
      tx(s, pts[i][0], { x: 9.45, y: y + 0.15, w: 3.1, h: 0.3, fontSize: 12, color: dark ? C.background2 : C.accent6 });
      tx(s, pts[i][1], { x: 9.45, y: y + 0.42, w: 3.1, h: 0.5, fontSize: 26, bold: true, color: C.accent1 });
      tx(s, pts[i][2], { x: 9.45, y: y + 0.95, w: 3.1, h: 0.5, fontSize: 12, color: dark ? C.background1 : C.text2 });
    }
    s.addNotes("Competitor prices are indicative benchmarks from brand stores, dealer counters and online listings, converted to RM where needed. Validate with a store and marketplace audit before final sign-off.");
  }

  // ================= 7. SALES ADVISOR LIST =================
  pres.addSection({ title: "Merchandise lists" });
  {
    const s = content("Merchandise lists", "Merchandise for sales advisors", "A professional toolkit plus customer-facing gifts, funded by HQ and co-funded with dealers");
    const hdr = ["Item", "Purpose", "Unit cost (RM)", "Allocation", "Funding"];
    const rows = [
      ["Uniform polo (quick-dry, eMAS teal)", "Consistent showroom image", "45", "3 per advisor", "HQ"],
      ["Softshell jacket", "Events, roadshows, outdoor", "95", "1 per advisor", "HQ"],
      ["Lanyard + digital name badge", "Identification, QR to profile", "12", "1 per advisor", "HQ"],
      ["Tablet folio", "e-brochure and configurator demos", "55", "1 per advisor", "HQ"],
      ["EV demo kit pouch", "Plug samples, charging guide card", "120", "2 per outlet", "HQ"],
      ["Golf umbrella", "Walk customers to test cars", "35", "1 per advisor", "Dealer"],
      ["Test-drive giveaway (keychain + sticker)", "Lead capture, footfall", "8", "Per test drive", "Marketing"],
      ["Handover welcome box", "Delivery 'wow' moment", "85", "Per vehicle delivered", "HQ / dealer 50:50"],
      ["Sales incentive rewards", "Premium jacket, 1:18 model", "199", "Per target achieved", "Sales budget"],
    ];
    const head = hdr.map((t, j) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 14, align: j === 2 ? "center" : "left" } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { fontSize: 14, color: j === 0 ? C.text1 : C.text2, bold: j === 0, align: j === 2 ? "center" : "left", fill: { color: i % 2 ? C.background1 : C.background2 } } })));
    s.addTable([head, ...body], { x: 0.5, y: 1.7, w: 12.3, colW: [3.9, 3.4, 1.6, 2.0, 1.4], rowH: 0.5, border: { type: "solid", pt: 0.5, color: "D5DEE5" }, valign: "middle", margin: [0.03, 0.1, 0.03, 0.1] });
    s.addNotes("Indicative toolkit cost: about RM450 per advisor in year one (excluding per-unit giveaways and welcome boxes).");
  }

  // ================= 8. END USER LIST =================
  {
    const s = content("Merchandise lists", "Merchandise for end users", "14 hero SKUs in four collections, sold in showrooms, the eMAS e-shop and official marketplace stores");
    const cols = [
      ["FaTshirt", "Apparel", [["Eco tee (recycled PET)", 69], ["Signature cap", 49], ["Windbreaker", 159]]],
      ["FaMugHot", "Lifestyle", [["Insulated tumbler 500ml", 59], ["Eco tote bag", 29], ["Auto-open umbrella", 45], ["Plush mascot (kids)", 49]]],
      ["FaChargingStation", "EV & car", [["Cable organiser bag", 89], ["Foldable sunshade", 69], ["3D floor-mat set", 249], ["Digital tyre inflator", 199]]],
      ["FaGift", "Collect & tech", [["1:24 diecast eMAS 7", 199], ["NFC key tag", 39], ["10,000mAh power bank", 89]]],
    ];
    const cw = 2.85, gap = 0.3, y = 1.75;
    for (let i = 0; i < 4; i++) {
      const x = 0.5 + i * (cw + gap);
      card(s, x, y, cw, 5.05, C.background2, cols[i][1] + " collection");
      await iconCircle(s, x + 0.25, y + 0.25, 0.7, cols[i][0], C.accent1, H.lt1, cols[i][1]);
      tx(s, cols[i][1], { x: x + 1.1, y: y + 0.25, w: 1.6, h: 0.7, fontSize: 19, bold: true, color: C.text1, valign: "middle" });
      cols[i][2].forEach(([name, price], k) => {
        const ry = y + 1.2 + k * 0.92;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: ry, w: cw - 0.4, h: 0.78, rectRadius: 0.08, fill: { color: C.background1 }, line: { type: "none" }, shadow: shadow(), objectName: name + " tile" });
        tx(s, name, { x: x + 0.35, y: ry + 0.06, w: cw - 0.7, h: 0.38, fontSize: 14, color: C.text1, valign: "middle" });
        tx(s, "RM" + price, { x: x + 0.35, y: ry + 0.42, w: cw - 0.7, h: 0.3, fontSize: 14, bold: true, color: C.accent1, valign: "middle" });
      });
    }
  }

  // ================= 9. PRICE WALK =================
  pres.addSection({ title: "Price walk and proposal" });
  {
    const s = content("Price walk and proposal", "Price walk: insulated tumbler (hero SKU)", "From RM18 ex-factory to RM59 RRP, with 31% margin to Proton and 34% to the dealer");
    const steps = [
      ["Ex-factory", 18, "inc"], ["Branding & packaging", 4, "inc"], ["Freight & duty", 3, "inc"], ["Warehouse & distribution", 2, "inc"],
      ["Landed cost", 27, "tot"], ["Proton margin", 12, "mar"], ["Dealer price", 39, "tot"], ["Dealer margin", 20, "mar"], ["RRP (incl. SST)", 59, "tot"],
    ];
    const x0 = 0.6, baseY = 6.1, top = 2.35, scale = (baseY - top) / 59, bw = 0.72, step = 0.94;
    s.addShape(pres.shapes.LINE, { x: x0 - 0.1, y: baseY, w: steps.length * step, h: 0, line: { color: "B9C6D2", width: 1 }, objectName: "Baseline" });
    let run = 0;
    steps.forEach(([label, v, kind], i) => {
      const x = x0 + i * step;
      let lo, hi;
      if (kind === "tot") { lo = 0; hi = v; run = v; } else { lo = run; hi = run + v; run = hi; }
      const fill = kind === "tot" ? C.text1 : kind === "mar" ? C.accent1 : "8FA3B5";
      const yTop = baseY - hi * scale, h = (hi - lo) * scale;
      s.addShape(pres.shapes.RECTANGLE, { x, y: yTop, w: bw, h, fill: { color: fill }, line: { type: "none" }, objectName: label + " bar" });
      tx(s, (kind === "tot" ? "RM" : "+") + v, { x: x - 0.15, y: yTop - 0.38, w: bw + 0.3, h: 0.32, fontSize: 13, bold: true, color: C.text1, align: "center", valign: "bottom" });
      tx(s, label, { x: x - 0.1, y: baseY + 0.08, w: bw + 0.2, h: 0.7, fontSize: 10, color: C.text2, align: "center" });
      if (i < steps.length - 1) {
        s.addShape(pres.shapes.LINE, { x: x + bw, y: baseY - run * scale, w: step - bw, h: 0, line: { color: "8FA3B5", width: 0.75, dashType: "dash" }, objectName: label + " connector" });
      }
    });
    // legend
    [["Cost build-up", "8FA3B5"], ["Margin", H.accent1], ["Price point", H.dk1]].forEach(([t, c], i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6 + i * 2.0, y: 1.75, w: 0.22, h: 0.22, fill: { color: c }, line: { type: "none" }, objectName: t + " key" });
      tx(s, t, { x: 0.9 + i * 2.0, y: 1.71, w: 1.6, h: 0.3, fontSize: 12, color: C.text2 });
    });
    // right panel
    card(s, 9.3, 1.75, 3.5, 5.05, C.background2, "Margin structure panel");
    tx(s, "Margin guardrails", { x: 9.55, y: 1.95, w: 3.0, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
    const g = [["30-50%", "Proton GM on dealer price"], ["30-40%", "Dealer GM on RRP"], ["≥ 2.0x", "RRP / landed cost multiple"], ["≤ 15%", "Max single-item promo (bundles ≤ 18%)"]];
    g.forEach(([a, b], i) => {
      tx(s, a, { x: 9.55, y: 2.55 + i * 1.02, w: 3.0, h: 0.45, fontSize: 24, bold: true, color: C.accent1 });
      tx(s, b, { x: 9.55, y: 3.0 + i * 1.02, w: 3.0, h: 0.35, fontSize: 13, color: C.text2 });
    });
    s.addNotes("Ex-factory cost assumes MOQ 3,000 units from an approved drinkware vendor. Branding includes laser-etched logo and recycled gift box. RRP shown inclusive of applicable SST.");
  }

  // ================= 10. PRICE PROPOSAL TABLE =================
  {
    const s = content("Price walk and proposal", "Price proposal: hero SKUs", "Every hero SKU clears the margin guardrails and is priced at or near BYD, far below Tesla");
    const data = [
      ["Signature cap", 17, 31, 49, "BYD 59 / Tesla 155"],
      ["Eco tee (recycled PET)", 24, 42, 69, "BYD 79 / Tesla 175"],
      ["Insulated tumbler 500ml", 27, 39, 59, "BYD 69 / Tesla 190"],
      ["NFC key tag", 12, 24, 39, "BYD 35 / Tesla 100"],
      ["Cable organiser bag", 38, 58, 89, "Aftermarket 79-129"],
      ["1:24 diecast eMAS 7", 95, 135, 199, "Licensed 1:24 models 180-260"],
      ["3D floor-mat set", 120, 170, 249, "Aftermarket 220-380"],
    ];
    const hdr = ["SKU", "Landed cost", "Dealer price", "RRP", "Proton GM", "Dealer GM", "Market reference (RM)"];
    const head = hdr.map((t, j) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 14, align: j > 0 && j < 6 ? "center" : "left" } }));
    const body = data.map((r, i) => {
      const [name, lc, dp, rrp, ref] = r;
      const pgm = Math.round(((dp - lc) / dp) * 100), dgm = Math.round(((rrp - dp) / rrp) * 100);
      const cells = [name, "RM" + lc, "RM" + dp, "RM" + rrp, pgm + "%", dgm + "%", ref];
      return cells.map((t, j) => ({ text: t, options: { fontSize: 14, bold: j === 0 || j === 3, color: j === 3 ? C.accent1 : j === 0 ? C.text1 : C.text2, align: j > 0 && j < 6 ? "center" : "left", fill: { color: i % 2 ? C.background1 : C.background2 } } }));
    });
    s.addTable([head, ...body], { x: 0.5, y: 1.7, w: 12.3, colW: [3.0, 1.35, 1.35, 1.1, 1.2, 1.2, 3.1], rowH: 0.48, border: { type: "solid", pt: 0.5, color: "D5DEE5" }, valign: "middle", margin: [0.03, 0.1, 0.03, 0.1] });
    // bundles
    const B = [
      ["FaGift", "eMAS Starter Pack", "Tumbler + cap + NFC key tag + organiser bag", "RM236 value  →  RM199"],
      ["FaChild", "Family Road-Trip Kit", "Sunshade + tyre inflator + plush + 2 tumblers", "RM435 value  →  RM359"],
      ["FaTrophy", "Owner Launch Edition", "Numbered 1:24 diecast + eco tee + gift box", "RM287 value  →  RM249"],
    ];
    for (let i = 0; i < 3; i++) {
      const x = 0.5 + i * 4.2;
      card(s, x, 5.7, 3.9, 1.15, C.background2, B[i][1] + " bundle");
      await iconCircle(s, x + 0.2, 5.92, 0.7, B[i][0], C.accent1, H.lt1, B[i][1]);
      tx(s, B[i][1], { x: x + 1.05, y: 5.8, w: 2.75, h: 0.32, fontSize: 14, bold: true, color: C.text1 });
      tx(s, B[i][2], { x: x + 1.05, y: 6.1, w: 2.75, h: 0.42, fontSize: 10, color: C.text2 });
      tx(s, B[i][3], { x: x + 1.05, y: 6.5, w: 2.75, h: 0.3, fontSize: 12, bold: true, color: C.accent1 });
    }
    s.addNotes("Bundles carry a 13-17% discount off summed RRP, inside the 18% bundle ceiling, and are funded by a higher attach rate. Starter Pack is also proposed as a value-add option in vehicle sales packages.");
  }

  // ================= 11. DASHBOARD =================
  pres.addSection({ title: "Launch planning" });
  {
    const s = content("Launch planning", "Launch planning dashboard", "Status as of 23 Nov 2026: on track for soft launch, with vendor sourcing the key watch item");
    const kpi = [["18%", "Overall progress"], ["99", "Days to soft launch (1 Mar 2027)"], ["32", "SKUs in development"], ["RM0.42M", "of RM1.2M budget committed"], ["2 / 10", "Workstreams at amber"]];
    const kw = 2.3, kg = 0.2;
    kpi.forEach(([v, l], i) => {
      const x = 0.5 + i * (kw + kg);
      card(s, x, 1.6, kw, 1.05, i === 0 ? C.text1 : C.background2, l + " KPI");
      tx(s, v, { x: x + 0.2, y: 1.66, w: kw - 0.4, h: 0.52, fontSize: 24, bold: true, color: i === 4 ? C.accent4 : C.accent1 });
      tx(s, l, { x: x + 0.2, y: 2.18, w: kw - 0.4, h: 0.4, fontSize: 11, color: i === 0 ? C.background2 : C.text2 });
    });
    // gantt
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const gx = 4.05, gw = 7.0, mw = gw / 8, gy = 2.95, rh = 0.36;
    const statusX = 11.2;
    tx(s, "Workstream", { x: 0.5, y: gy, w: 3.4, h: 0.3, fontSize: 11, bold: true, color: C.accent6 });
    tx(s, "Owner", { x: 2.95, y: gy, w: 1.0, h: 0.3, fontSize: 11, bold: true, color: C.accent6 });
    months.forEach((m, i) => tx(s, m + (i < 2 ? " '26" : " '27"), { x: gx + i * mw, y: gy, w: mw, h: 0.3, fontSize: 11, bold: true, color: C.accent6, align: "center" }));
    tx(s, "Status", { x: statusX, y: gy, w: 1.6, h: 0.3, fontSize: 11, bold: true, color: C.accent6 });
    // tasks: [name, owner, startMonthIdx(float), endMonthIdx(float), progress 0-1, status]
    const T = [
      ["Concept & range approval", "Product", 0, 1.5, 0.8, "G"],
      ["Design & brand sign-off", "Brand", 0.8, 2.5, 0.3, "G"],
      ["Vendor sourcing & RFQ", "Procure.", 1, 3, 0.15, "A"],
      ["Sampling & quality testing", "QA", 2, 3.5, 0, "G"],
      ["Pricing & dealer terms", "Finance", 2, 3.3, 0, "G"],
      ["Production & delivery", "Supply", 3, 4.8, 0, "A"],
      ["E-shop & marketplace setup", "Digital", 3, 4.6, 0, "G"],
      ["SA training & kit rollout", "Sales", 3.4, 4.3, 0, "G"],
      ["Launch campaign", "Mktg", 3.8, 7.2, 0, "G"],
      ["Post-launch review", "PMO", 5, 8, 0, "G"],
    ];
    const RAG = { G: [H.accent3, "On track"], A: [H.accent4, "At risk"], R: [H.accent5, "Delayed"] };
    for (let i = 0; i < 8; i++) if (i % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: gx + i * mw, y: gy + 0.32, w: mw, h: T.length * rh, fill: { color: C.background2 }, line: { type: "none" }, objectName: months[i] + " band" });
    T.forEach(([name, owner, a, b, p, st], i) => {
      const y = gy + 0.32 + i * rh;
      tx(s, name, { x: 0.5, y, w: 2.45, h: rh, fontSize: 11, color: C.text1, valign: "middle" });
      tx(s, owner, { x: 2.95, y, w: 1.05, h: rh, fontSize: 11, color: C.text2, valign: "middle" });
      const bx = gx + a * mw, bwid = (b - a) * mw;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: y + 0.08, w: bwid, h: rh - 0.16, rectRadius: 0.05, fill: { color: "B9C6D2" }, line: { type: "none" }, objectName: name + " bar" });
      if (p > 0) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: y + 0.08, w: bwid * p, h: rh - 0.16, rectRadius: 0.05, fill: { color: C.accent1 }, line: { type: "none" }, objectName: name + " progress" });
      s.addShape(pres.shapes.OVAL, { x: statusX, y: y + 0.1, w: 0.16, h: 0.16, fill: { color: RAG[st][0] }, line: { type: "none" }, objectName: name + " status" });
      tx(s, RAG[st][1] + (p > 0 ? "  " + Math.round(p * 100) + "%" : ""), { x: statusX + 0.25, y, w: 1.4, h: rh, fontSize: 11, color: C.text2, valign: "middle" });
    });
    const gBottom = gy + 0.32 + T.length * rh;
    // today line (23 Nov = 0.73 of Nov)
    const todayX = gx + (22 / 30) * mw;
    s.addShape(pres.shapes.LINE, { x: todayX, y: gy + 0.3, w: 0, h: T.length * rh + 0.05, line: { color: H.accent5, width: 1.25, dashType: "dash" }, objectName: "Today line" });
    tx(s, "Today", { x: todayX - 0.4, y: gBottom + 0.03, w: 0.8, h: 0.25, fontSize: 10, bold: true, color: C.accent5, align: "center" });
    // milestones
    [["Soft launch 1 Mar", 4.0], ["Full launch 1 Jun", 7.0]].forEach(([l, m]) => {
      const mx = gx + m * mw;
      s.addShape(pres.shapes.LINE, { x: mx, y: gy + 0.3, w: 0, h: T.length * rh + 0.05, line: { color: H.dk1, width: 1.25 }, objectName: l + " line" });
      s.addShape(pres.shapes.DIAMOND, { x: mx - 0.11, y: gBottom + 0.04, w: 0.22, h: 0.22, fill: { color: C.text1 }, line: { type: "none" }, objectName: l + " marker" });
      tx(s, l, { x: mx + 0.15, y: gBottom + 0.02, w: 1.6, h: 0.26, fontSize: 10, bold: true, color: C.text1 });
    });
    s.addNotes("Amber items: (1) vendor RFQ - only 2 of 4 shortlisted drinkware/apparel vendors have quoted; mitigation: add a local Malaysian vendor. (2) Production lead time 8-10 weeks leaves little buffer before 1 Mar; mitigation: air-freight the 6 hero SKUs for soft launch. Update this dashboard every fortnight at the steering committee.");
  }

  // ================= 12. SHORT-TERM =================
  pres.addSection({ title: "Strategy" });
  {
    const s = content("Strategy", "Short-term strategy: first 12 months", "Launch fast with a focused hero range, then widen channels and build the owner community");
    const ph = [
      ["FaRocket", "0-3 months", "Launch the core", ["14 hero SKUs + SA toolkit in all eMAS showrooms", "Welcome box in every vehicle handover", "Test-drive giveaways to drive footfall"], "KPI: 25% of buyers purchase merchandise"],
      ["FaStore", "3-6 months", "Widen the channels", ["eMAS e-shop and official Shopee / Lazada stores", "Pop-ups at motor shows and EV events", "Bundles as value-add in sales campaigns"], "KPI: 30% of revenue from online"],
      ["FaUsers", "6-12 months", "Grow community", ["eMAS owner club with member pricing", "Limited editions for festive seasons", "Refresh slow movers using sell-through data"], "KPI: RM2.4M revenue, 45% blended GM"],
    ];
    const cw = 3.9, gap = 0.3, y = 1.75;
    for (let i = 0; i < 3; i++) {
      const x = 0.5 + i * (cw + gap);
      card(s, x, y, cw, 5.1, C.background2, ph[i][2] + " phase");
      await iconCircle(s, x + 0.3, y + 0.3, 0.8, ph[i][0], C.accent1, H.lt1, ph[i][2]);
      tx(s, ph[i][1], { x: x + 1.3, y: y + 0.3, w: 2.4, h: 0.35, fontSize: 13, bold: true, color: C.accent1 });
      tx(s, ph[i][2], { x: x + 1.3, y: y + 0.65, w: 2.4, h: 0.45, fontSize: 20, bold: true, color: C.text1 });
      s.addText(ph[i][3].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < 2 } })), { isTextBox: true, x: x + 0.3, y: y + 1.4, w: cw - 0.6, h: 2.5, fontSize: 15, color: C.text2, paraSpaceAfter: 10, valign: "top", margin: 0 });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: y + 4.1, w: cw - 0.6, h: 0.7, rectRadius: 0.08, fill: { color: C.text1 }, line: { type: "none" }, objectName: ph[i][2] + " KPI" });
      tx(s, ph[i][4], { x: x + 0.45, y: y + 4.1, w: cw - 0.9, h: 0.7, fontSize: 13, bold: true, color: C.background1, valign: "middle" });
    }
  }

  // ================= 13. LONG-TERM =================
  {
    const s = content("Strategy", "Long-term strategy: years 2 to 3", "Grow eMAS merchandise from a showroom add-on into a lifestyle brand and profit centre");
    const pil = [
      ["FaTshirt", "Lifestyle collection", "Seasonal eMAS collections and collaborations with Malaysian designers and artists."],
      ["FaLeaf", "Sustainability", "Raise recycled or low-impact materials from 50% of SKUs to 80% by 2029."],
      ["FaGlobeAsia", "Regional rollout", "Ship the range with eMAS into new export markets, using one global catalogue."],
      ["FaDatabase", "Data & personalisation", "Link merchandise to owner CRM and app for personalised offers and rewards."],
      ["FaHandshake", "Licensing", "License the eMAS brand for toys, accessories and apparel to earn royalty income."],
    ];
    for (let i = 0; i < pil.length; i++) {
      const y = 1.75 + i * 1.0;
      await iconCircle(s, 0.5, y + 0.05, 0.72, pil[i][0], C.accent1, H.lt1, pil[i][1]);
      tx(s, pil[i][1], { x: 1.45, y: y, w: 5.6, h: 0.38, fontSize: 18, bold: true, color: C.text1 });
      tx(s, pil[i][2], { x: 1.45, y: y + 0.4, w: 6.0, h: 0.5, fontSize: 14, color: C.text2 });
    }
    s.addChart(pres.charts.BAR, [{ name: "Revenue (RM M)", labels: ["2027", "2028", "2029"], values: [2.4, 4.0, 6.0] }], {
      x: 7.9, y: 1.7, w: 4.9, h: 5.1, barDir: "col", barGapWidthPct: 55,
      showTitle: true, title: "Merchandise revenue target (RM million)", titleFontSize: 14, titleColor: H.dk1, titleFontFace: "+mn-lt",
      chartColors: [H.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: H.dk2, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "0.0",
      catAxisLabelColor: H.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    });
    s.addNotes("Revenue targets assume growth of the eMAS owner base, online share rising to 40% and licensing income from 2029. Revisit annually.");
  }

  // ================= 14. NEXT STEPS =================
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Strategy" });
    tx(s, "Decisions needed and next steps", { x: 0.7, y: 0.6, w: 11.9, h: 0.8, fontSize: 36, bold: true, color: C.background1 });
    const st = [
      ["1", "Approve range & pricing", "14 hero SKUs, 9-item SA toolkit and the margin guardrails", "Steering committee, 4 Dec 2026"],
      ["2", "Release budget", "RM1.2M year-one budget, incl. RM0.78M initial stock", "Finance, 11 Dec 2026"],
      ["3", "Award vendors", "Close RFQ, add a local backup vendor for apparel and drinkware", "Procurement, 15 Jan 2027"],
      ["4", "Lock launch plan", "Soft launch 1 Mar 2027; full launch with e-shop 1 Jun 2027", "PMO, fortnightly review"],
    ];
    st.forEach(([num, h, d, who], i) => {
      const x = 0.7 + i * 3.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.9, w: 2.8, h: 4.4, rectRadius: 0.12, fill: { color: "16324A" }, line: { type: "none" }, objectName: h + " card" });
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.2, w: 0.8, h: 0.8, fill: { color: C.accent1 }, line: { type: "none" }, objectName: h + " number" });
      tx(s, num, { x: x + 0.3, y: 2.2, w: 0.8, h: 0.8, fontSize: 24, bold: true, color: C.background1, align: "center", valign: "middle" });
      tx(s, h, { x: x + 0.3, y: 3.25, w: 2.3, h: 0.75, fontSize: 19, bold: true, color: C.background1 });
      tx(s, d, { x: x + 0.3, y: 4.05, w: 2.3, h: 1.3, fontSize: 14, color: C.background2 });
      tx(s, who, { x: x + 0.3, y: 5.5, w: 2.3, h: 0.6, fontSize: 12, bold: true, color: C.accent3 });
    });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
