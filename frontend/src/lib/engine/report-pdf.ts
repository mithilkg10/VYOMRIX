// Minimal multi page PDF writer (PDF 1.4, built in Helvetica fonts). No dependencies,
// so reports are generated entirely in the browser from live engine data.

export interface ReportSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { columns: string[]; widths: number[]; rows: string[][] };
}

export interface ReportDoc {
  title: string;
  subtitle: string;
  badge: string;
  meta: [string, string][];
  sections: ReportSection[];
  footer: string;
}

const W = 595;
const H = 842;
const M = 44;

const ascii = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, " ").replace(/·/g, "|").replace(/…/g, "...").replace(/[^\x20-\x7e]/g, "?");
const esc = (s: string) => ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `${((n >> 16) & 255) / 255} ${((n >> 8) & 255) / 255} ${(n & 255) / 255}`; };

function wrap(text: string, size: number, width: number) {
  const max = Math.max(8, Math.floor(width / (size * 0.5)));
  const words = ascii(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w.length > max ? w.slice(0, max) : w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export function buildReportPdf(doc: ReportDoc) {
  const pages: string[][] = [];
  let c: string[] = [];
  let y = 0;
  const text = (t: string, x: number, yy: number, size: number, bold = false, color = "#0f172a") => c.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color)} rg ${x} ${yy} Td (${esc(t)}) Tj ET`);
  const rect = (x: number, yy: number, w: number, h: number, color: string) => c.push(`${rgb(color)} rg ${x} ${yy} ${w} ${h} re f`);
  const line = (x1: number, y1: number, x2: number, y2: number) => c.push(`0.85 0.88 0.92 RG 0.6 w ${x1} ${y1} m ${x2} ${y2} l S`);
  const newPage = (first = false) => {
    if (c.length) pages.push(c);
    c = [];
    if (first) {
      rect(0, H - 120, W, 120, "#06101f");
      rect(0, H - 124, W, 4, "#22d3ee");
      text("VYOMRIX", M, H - 44, 11, true, "#22d3ee");
      text("Detection and response platform", M + 66, H - 44, 8.5, false, "#94a3b8");
      text(doc.title, M, H - 76, 19, true, "#ffffff");
      text(doc.subtitle, M, H - 98, 9.5, false, "#cbd5e1");
      rect(W - M - 110, H - 56, 110, 20, "#22d3ee");
      text(doc.badge, W - M - 102, H - 49.5, 8.5, true, "#06101f");
      y = H - 150;
      const colW = (W - 2 * M) / 3;
      doc.meta.forEach(([k, v], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        text(k.toUpperCase(), M + col * colW, y - row * 32, 7, true, "#64748b");
        text(v, M + col * colW, y - row * 32 - 12, 9.5, true, "#0f172a");
      });
      y -= Math.ceil(doc.meta.length / 3) * 32 + 14;
    } else {
      text(`VYOMRIX | ${doc.title}`, M, H - 30, 8, true, "#64748b");
      line(M, H - 36, W - M, H - 36);
      y = H - 58;
    }
  };
  const ensure = (need: number) => { if (y - need < 70) newPage(); };
  newPage(true);

  for (const s of doc.sections) {
    ensure(40);
    text(s.heading, M, y, 11.5, true, "#0e7490");
    line(M, y - 6, W - M, y - 6);
    y -= 22;
    for (const p of s.paragraphs ?? []) {
      for (const l of wrap(p, 9.4, W - 2 * M)) { ensure(14); text(l, M, y, 9.4, false, "#1e293b"); y -= 13; }
      y -= 6;
    }
    for (const b of s.bullets ?? []) {
      const lines = wrap(b, 9.2, W - 2 * M - 14);
      ensure(lines.length * 13 + 2);
      rect(M + 2, y + 2.5, 3, 3, "#22d3ee");
      lines.forEach((l, i) => { text(l, M + 14, y, 9.2, false, "#1e293b"); y -= 13; void i; });
      y -= 3;
    }
    if (s.table) {
      const { columns, widths, rows } = s.table;
      const total = widths.reduce((a, b) => a + b, 0);
      const ws = widths.map((w) => (w / total) * (W - 2 * M));
      const header = () => { ensure(22); rect(M, y - 5, W - 2 * M, 17, "#e2e8f0"); let x = M + 4; columns.forEach((col, i) => { text(col, x, y, 7.6, true, "#334155"); x += ws[i]; }); y -= 18; };
      header();
      for (const r of rows) {
        const cells = r.map((cell, i) => wrap(cell, 8, ws[i] - 8).slice(0, 4));
        const h = Math.max(...cells.map((x) => x.length)) * 11 + 4;
        if (y - h < 70) { newPage(); header(); }
        let x = M + 4;
        cells.forEach((lines, i) => { lines.forEach((l, j) => text(l, x, y - j * 11, 8, false, "#1e293b")); x += ws[i]; });
        y -= h;
        line(M, y + 6, W - M, y + 6);
      }
      y -= 8;
    }
    y -= 8;
  }
  pages.push(c);

  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("PAGES");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pageIds: number[] = [];
  pages.forEach((ops, i) => {
    ops.push(`BT /F1 7.5 Tf ${rgb("#64748b")} rg ${M} 30 Td (${esc(doc.footer)}) Tj ET`);
    ops.push(`BT /F1 7.5 Tf ${rgb("#64748b")} rg ${W - M - 50} 30 Td (Page ${i + 1} of ${pages.length}) Tj ET`);
    const content = ops.join("\n");
    const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>`));
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}
