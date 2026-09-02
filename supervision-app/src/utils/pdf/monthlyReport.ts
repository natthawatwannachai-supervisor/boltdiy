import jsPDF from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import {
  APP_NAME,
  DEVELOPER_INFO,
  LOGO_URL,
  ORGANISATION,
  SUPERVISION_CATEGORIES,
} from '@/config/constants';
import type { SupervisionRecord, UserProfile } from '@/types';
import { dayCount, fileStamp, formatMonthKey, formatThaiDateRange, formatTimeRange } from '@/utils/date';
import { fitInside, loadImage, type LoadedImage } from './images';
import { registerThaiFont, THAI_FONT } from './fonts';

/**
 * A4 **portrait** — 210 mm x 297 mm.
 *
 * The specification wrote "A4 portrait (29.7cm x 21cm)"; those two numbers are
 * A4's landscape ordering, so portrait (the stated orientation) is used and the
 * page is 21.0 cm wide by 29.7 cm tall.
 */
const PAGE = { width: 210, height: 297 } as const;
const MARGIN = { left: 15, right: 15, top: 14, bottom: 18 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const BRAND: [number, number, number] = [16, 185, 129];
const BRAND_DEEP: [number, number, number] = [15, 118, 110];
const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 122, 144];
const ROW_ALT: [number, number, number] = [240, 247, 244];

export interface ReportOptions {
  profile: UserProfile;
  records: SupervisionRecord[];
  /** `yyyy-mm`, or `all` for a full-history report. */
  monthKey: string;
  /** Skips the photo appendix — useful for a quick text-only summary. */
  includeImages?: boolean;
  /** Called with 0–100 so the UI can show progress while images download. */
  onProgress?: (percent: number) => void;
}

interface Assets {
  logo: LoadedImage | null;
  signature: LoadedImage | null;
  photos: Map<string, LoadedImage[]>;
}

/** Builds the monthly report and triggers the browser download. */
export async function generateMonthlyReport(options: ReportOptions): Promise<void> {
  const { doc, fileName } = await buildMonthlyReport(options);

  // `doc.save()` goes through jsPDF's bundled FileSaver, which drops the file
  // name on some browsers and hands the user a file called "download". Driving
  // the anchor directly keeps the report's name intact.
  const url = URL.createObjectURL(doc.output('blob'));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();

  // Removing the anchor (or revoking the URL) in the same tick can cancel the
  // download or strip its file name, so both are deferred.
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 10_000);

  options.onProgress?.(100);
}

/**
 * Builds the document without saving it — used by the download above and by
 * `pdf-preview.html`, which renders the report inline for layout checks.
 */
export async function buildMonthlyReport(
  options: ReportOptions,
): Promise<{ doc: jsPDF; fileName: string }> {
  const { profile, records, monthKey, includeImages = true, onProgress } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  onProgress?.(5);

  const fontReady = await registerThaiFont(doc);

  if (!fontReady) {
    console.warn('[pdf] Sarabun is unavailable; Thai text may not render correctly.');
  }

  onProgress?.(15);

  const assets = await loadAssets(profile, records, includeImages, onProgress);

  onProgress?.(65);

  const periodLabel = monthKey === 'all' ? 'ทุกเดือน' : formatMonthKey(monthKey);
  let cursorY = drawCoverHeader(doc, assets.logo, periodLabel, profile, records);

  cursorY = drawCategoryTables(doc, records, cursorY);
  cursorY = drawSummaryTable(doc, records, cursorY);

  if (includeImages) {
    cursorY = drawPhotoAppendix(doc, records, assets.photos, cursorY);
  }

  onProgress?.(85);

  // The signature block must exist on the LAST page only, so it is drawn after
  // every other section has decided how many pages the report needs.
  drawSignatureBlock(doc, profile, assets.signature, cursorY);
  drawPageFurniture(doc, periodLabel);

  onProgress?.(97);

  const suffix = monthKey === 'all' ? `all-${fileStamp()}` : monthKey;
  const owner = asciiSlug(profile.fullName);

  return {
    doc,
    fileName: ['report-supervision', owner, suffix].filter(Boolean).join('-') + '.pdf',
  };
}

/* ------------------------------------------------------------------ assets */

async function loadAssets(
  profile: UserProfile,
  records: SupervisionRecord[],
  includeImages: boolean,
  onProgress?: (percent: number) => void,
): Promise<Assets> {
  const [logo, signature] = await Promise.all([
    loadImage(LOGO_URL, 600),
    profile.signatureUrl ? loadImage(profile.signatureUrl, 900) : Promise.resolve(null),
  ]);

  const photos = new Map<string, LoadedImage[]>();

  if (includeImages) {
    const withImages = records.filter((record) => record.images?.length);

    for (let index = 0; index < withImages.length; index += 1) {
      const record = withImages[index];
      const loaded = await Promise.all(record.images.slice(0, 2).map((image) => loadImage(image.url, 1400)));

      photos.set(record.id, loaded.filter(Boolean) as LoadedImage[]);
      onProgress?.(15 + Math.round(((index + 1) / withImages.length) * 45));
    }
  }

  return { logo, signature, photos };
}

/* ------------------------------------------------------------------ header */

function drawCoverHeader(
  doc: jsPDF,
  logo: LoadedImage | null,
  periodLabel: string,
  profile: UserProfile,
  records: SupervisionRecord[],
): number {
  let y: number = MARGIN.top;

  if (logo) {
    const size = fitInside(logo, 24, 24);

    doc.addImage(
      logo.dataUrl,
      logo.format,
      (PAGE.width - size.width) / 2,
      y,
      size.width,
      size.height,
    );
    y += size.height + 4;
  }

  doc.setFont(THAI_FONT, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  y = writeCentred(doc, APP_NAME, y + 4, 14);

  doc.setFontSize(13);
  y = writeCentred(doc, ORGANISATION, y + 1, 12);

  doc.setFont(THAI_FONT, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_DEEP);
  y = writeCentred(doc, `สรุปผลการนิเทศ ประจำเดือน ${periodLabel}`, y + 2, 11);

  // Accent rule under the title block.
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.8);
  doc.line(MARGIN.left, y + 2, PAGE.width - MARGIN.right, y + 2);
  y += 8;

  const totalDays = records.reduce((sum, record) => sum + dayCount(record.startDate, record.endDate), 0);
  const totalImages = records.reduce((sum, record) => sum + (record.images?.length ?? 0), 0);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    theme: 'plain',
    styles: { font: THAI_FONT, fontSize: 10, cellPadding: 1.6, textColor: INK },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: MUTED },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, fontStyle: 'bold', textColor: MUTED },
      3: { cellWidth: CONTENT_WIDTH - 120 },
    },
    body: [
      ['ผู้รายงาน', profile.fullName, 'ตำแหน่ง', profile.position],
      ['วิทยฐานะ', profile.academicStanding || '-', 'กลุ่ม/ฝ่ายงาน', profile.department || '-'],
      [
        'จำนวนครั้งที่นิเทศ',
        `${records.length} ครั้ง (รวม ${totalDays} วัน)`,
        'ภาพประกอบ',
        `${totalImages} ภาพ`,
      ],
    ],
  });

  return lastY(doc) + 6;
}

/* ------------------------------------------------------------- main tables */

function drawCategoryTables(doc: jsPDF, records: SupervisionRecord[], startY: number): number {
  const groups = groupByCategory(records);
  let y = startY;

  if (!groups.length) {
    doc.setFont(THAI_FONT, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text('ไม่พบข้อมูลการนิเทศในช่วงเวลาที่เลือก', MARGIN.left, y + 6);

    return y + 14;
  }

  groups.forEach(([category, items], groupIndex) => {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, `${groupIndex + 1}. ${category}  (${items.length} ครั้ง)`, y);

    const body: RowInput[] = items.map((record, index) => [
      String(index + 1),
      formatThaiDateRange(record.startDate, record.endDate),
      formatTimeRange(record.startTime, record.endTime),
      record.topic,
      record.location,
      record.content,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN.left, right: MARGIN.right, top: MARGIN.top, bottom: MARGIN.bottom },
      head: [['ที่', 'วัน/เดือน/ปี ที่นิเทศ', 'เวลา', 'เรื่องที่นิเทศ', 'สถานที่', 'ผลการนิเทศ']],
      body,
      theme: 'grid',
      styles: {
        font: THAI_FONT,
        fontSize: 9.5,
        cellPadding: 2,
        textColor: INK,
        lineColor: [205, 214, 224],
        lineWidth: 0.15,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        font: THAI_FONT,
        fontStyle: 'bold',
        fillColor: BRAND,
        textColor: [255, 255, 255],
        halign: 'center',
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: ROW_ALT },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 37 },
        4: { cellWidth: 30 },
        5: { cellWidth: 55 },
      },
    });

    y = lastY(doc) + 7;
  });

  return y;
}

function drawSummaryTable(doc: jsPDF, records: SupervisionRecord[], startY: number): number {
  if (!records.length) {
    return startY;
  }

  let y = ensureSpace(doc, startY, 40);

  y = drawSectionTitle(doc, 'สรุปภาพรวมจำแนกตามงานนิเทศ', y);

  const groups = groupByCategory(records);
  const body: RowInput[] = groups.map(([category, items], index) => [
    String(index + 1),
    category,
    `${items.length}`,
    `${items.reduce((sum, record) => sum + dayCount(record.startDate, record.endDate), 0)}`,
    `${((items.length / records.length) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right, top: MARGIN.top, bottom: MARGIN.bottom },
    head: [['ที่', 'งานนิเทศ', 'จำนวนครั้ง', 'รวมวัน', 'สัดส่วน']],
    body,
    foot: [
      [
        '',
        'รวมทั้งสิ้น',
        `${records.length}`,
        `${records.reduce((sum, record) => sum + dayCount(record.startDate, record.endDate), 0)}`,
        '100.0%',
      ],
    ],
    theme: 'grid',
    styles: {
      font: THAI_FONT,
      fontSize: 10,
      cellPadding: 2.2,
      textColor: INK,
      lineColor: [205, 214, 224],
      lineWidth: 0.15,
    },
    headStyles: {
      font: THAI_FONT,
      fontStyle: 'bold',
      fillColor: BRAND_DEEP,
      textColor: [255, 255, 255],
      halign: 'center',
    },
    footStyles: {
      font: THAI_FONT,
      fontStyle: 'bold',
      fillColor: [226, 240, 236],
      textColor: INK,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: CONTENT_WIDTH - 92 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
    },
  });

  return lastY(doc) + 8;
}

/* ---------------------------------------------------------- photo appendix */

function drawPhotoAppendix(
  doc: jsPDF,
  records: SupervisionRecord[],
  photos: Map<string, LoadedImage[]>,
  startY: number,
): number {
  const withPhotos = records.filter((record) => (photos.get(record.id)?.length ?? 0) > 0);

  if (!withPhotos.length) {
    return startY;
  }

  let y = ensureSpace(doc, startY, 60);

  y = drawSectionTitle(doc, 'ภาคผนวก : ภาพประกอบการนิเทศ', y);

  const BOX_HEIGHT = 52;
  const GAP = 6;
  const boxWidth = (CONTENT_WIDTH - GAP) / 2;

  withPhotos.forEach((record) => {
    const images = photos.get(record.id) ?? [];

    y = ensureSpace(doc, y, BOX_HEIGHT + 20);

    doc.setFont(THAI_FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DEEP);
    doc.text(
      truncate(doc, `${record.topic} — ${record.location}`, CONTENT_WIDTH),
      MARGIN.left,
      y + 4,
    );

    doc.setFont(THAI_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
      `${formatThaiDateRange(record.startDate, record.endDate)} เวลา ${formatTimeRange(
        record.startTime,
        record.endTime,
      )}`,
      MARGIN.left,
      y + 9,
    );

    const top = y + 12;

    images.slice(0, 2).forEach((image, index) => {
      const boxX = MARGIN.left + index * (boxWidth + GAP);
      const size = fitInside(image, boxWidth - 4, BOX_HEIGHT - 4);

      doc.setDrawColor(205, 214, 224);
      doc.setLineWidth(0.2);
      doc.roundedRect(boxX, top, boxWidth, BOX_HEIGHT, 2, 2, 'S');
      doc.addImage(
        image.dataUrl,
        image.format,
        boxX + (boxWidth - size.width) / 2,
        top + (BOX_HEIGHT - size.height) / 2,
        size.width,
        size.height,
      );
    });

    y = top + BOX_HEIGHT + 8;
  });

  return y;
}

/* ------------------------------------------------------------- signature */

function drawSignatureBlock(
  doc: jsPDF,
  profile: UserProfile,
  signature: LoadedImage | null,
  cursorY: number,
): void {
  const BLOCK_HEIGHT = 46;
  const BLOCK_WIDTH = 72;

  // Always work on the final page, adding one only if the block would collide
  // with the content already on it.
  doc.setPage(doc.getNumberOfPages());

  // The block is anchored to the bottom-right corner, not to wherever the
  // content happened to stop.
  let top = PAGE.height - MARGIN.bottom - BLOCK_HEIGHT;

  if (cursorY + 6 > top) {
    doc.addPage();
    top = PAGE.height - MARGIN.bottom - BLOCK_HEIGHT;
  }

  const left = PAGE.width - MARGIN.right - BLOCK_WIDTH;
  const centre = left + BLOCK_WIDTH / 2;

  doc.setFont(THAI_FONT, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('ลงชื่อ', left, top + 4);

  if (signature) {
    const size = fitInside(signature, BLOCK_WIDTH - 18, 18);

    doc.addImage(
      signature.dataUrl,
      signature.format,
      centre - size.width / 2 + 4,
      top - 4,
      size.width,
      size.height,
    );
  }

  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.3);
  doc.line(left + 12, top + 16, left + BLOCK_WIDTH, top + 16);

  doc.setFontSize(11);
  doc.text(`( ${profile.fullName} )`, centre + 6, top + 23, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`ตำแหน่ง ${profile.position}`, centre + 6, top + 30, { align: 'center' });

  if (profile.academicStanding && profile.academicStanding !== 'ไม่มีวิทยฐานะ') {
    doc.text(`วิทยฐานะ ${profile.academicStanding}`, centre + 6, top + 36, { align: 'center' });
  }
}

/* -------------------------------------------------- per-page header/footer */

function drawPageFurniture(doc: jsPDF, periodLabel: string): void {
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(214, 222, 231);
    doc.setLineWidth(0.2);
    doc.line(
      MARGIN.left,
      PAGE.height - MARGIN.bottom + 4,
      PAGE.width - MARGIN.right,
      PAGE.height - MARGIN.bottom + 4,
    );

    doc.setFont(THAI_FONT, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(DEVELOPER_INFO, MARGIN.left, PAGE.height - MARGIN.bottom + 9, { maxWidth: 140 });
    doc.text(
      `หน้า ${page} / ${pages}`,
      PAGE.width - MARGIN.right,
      PAGE.height - MARGIN.bottom + 9,
      { align: 'right' },
    );

    if (page > 1) {
      doc.setFontSize(8.5);
      doc.text(`สรุปผลการนิเทศ ประจำเดือน ${periodLabel}`, MARGIN.left, MARGIN.top - 5);
      doc.line(MARGIN.left, MARGIN.top - 3, PAGE.width - MARGIN.right, MARGIN.top - 3);
    }
  }
}

/* ----------------------------------------------------------------- helpers */

function groupByCategory(records: SupervisionRecord[]): Array<[string, SupervisionRecord[]]> {
  const buckets = new Map<string, SupervisionRecord[]>();

  records.forEach((record) => {
    const key = record.category || 'อื่น ๆ';

    buckets.set(key, [...(buckets.get(key) ?? []), record]);
  });

  const order = new Map(SUPERVISION_CATEGORIES.map((name, index) => [name as string, index]));

  return [...buckets.entries()].sort(
    ([a], [b]) => (order.get(a) ?? 99) - (order.get(b) ?? 99) || a.localeCompare(b, 'th'),
  );
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BRAND);
  doc.roundedRect(MARGIN.left, y, 3, 6, 1.5, 1.5, 'F');

  doc.setFont(THAI_FONT, 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN.left + 6, y + 4.8);

  return y + 9;
}

/** Adds a page when `needed` mm would overflow the current one. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE.height - MARGIN.bottom) {
    doc.addPage();

    return MARGIN.top + 4;
  }

  return y;
}

function writeCentred(doc: jsPDF, text: string, y: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];

  lines.forEach((line, index) => {
    doc.text(line, PAGE.width / 2, y + index * (lineHeight * 0.42), { align: 'center' });
  });

  return y + (lines.length - 1) * (lineHeight * 0.42) + 4;
}

function truncate(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) {
    return text;
  }

  let result = text;

  while (result.length > 4 && doc.getTextWidth(`${result}…`) > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}…`;
}

/** `lastAutoTable` is attached to the doc by jspdf-autotable at runtime. */
function lastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? MARGIN.top;
}

/**
 * Chromium silently ignores an `<a download>` name containing non-ASCII
 * characters and saves the file as "download" instead, so a Thai name is
 * reduced to whatever ASCII it contains — often nothing, which is fine: the
 * supervisor's full name is printed inside the report itself.
 */
function asciiSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 40);
}
