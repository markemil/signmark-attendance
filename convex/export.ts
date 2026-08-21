"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// "use node" (needed for xlsx/pdf-lib) means this file can't also export a
// query or mutation — those live in export_data.ts and are only reached
// here via `internal.export_data.*`. Nothing below is exported except the
// action itself.
export const generate = action({
  args: {
    token: v.string(),
    employeeId: v.id("employees"),
    periodStart: v.string(),
    periodEnd: v.string(),
    format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("pdf")),
  },
  returns: v.object({ url: v.string(), filename: v.string() }),
  handler: async (ctx, args): Promise<{ url: string; filename: string }> => {
    const data: {
      adminId: Id<"users">;
      employee: { fullName: string; employeeCode: string };
      rows: ExportRow[];
    } = await ctx.runQuery(internal.export_data.getExportRows, {
      token: args.token,
      employeeId: args.employeeId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
    });

    const baseName = `${data.employee.employeeCode}_${args.periodStart}_to_${args.periodEnd}`;
    let bytes: Uint8Array;
    let filename: string;
    let contentType: string;

    if (args.format === "csv") {
      bytes = new TextEncoder().encode(toCsv(data.rows));
      filename = `${baseName}.csv`;
      contentType = "text/csv";
    } else if (args.format === "xlsx") {
      bytes = toXlsx(data.employee, args.periodStart, args.periodEnd, data.rows);
      filename = `${baseName}.xlsx`;
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      bytes = await toPdf(data.employee, args.periodStart, args.periodEnd, data.rows);
      filename = `${baseName}.pdf`;
      contentType = "application/pdf";
    }

    const blob = new Blob([bytes as BlobPart], { type: contentType });
    const fileStorageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.export_data.recordExportBatch, {
      employeeId: args.employeeId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      generatedBy: data.adminId,
      format: args.format,
      fileStorageId,
    });

    const url = await ctx.storage.getUrl(fileStorageId);
    if (!url) throw new Error("Generated file could not be located after storing.");
    return { url, filename };
  },
});

// --- shared shapes/helpers -------------------------------------------------

type ExportRow = {
  date: string;
  status: string;
  holidayName?: string;
  firstIn: number | null;
  lastOut: number | null;
  totalHours: number;
  adminEntered: boolean;
  inPhotoUrl: string | null;
  outPhotoUrl: string | null;
};

function fmtTime(ts: number | null): string {
  if (ts === null) return "";
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
}

function statusLabel(status: string, holidayName?: string): string {
  switch (status) {
    case "worked":
      return "Present";
    case "holiday":
      return `Holiday${holidayName ? ` (${holidayName})` : ""}`;
    case "holiday_worked":
      return `Holiday · Worked${holidayName ? ` (${holidayName})` : ""}`;
    case "absent":
      return "Absent";
    default:
      return "";
  }
}

const HEADERS = [
  "Date",
  "Time In",
  "Time Out",
  "Total Hours",
  "Status",
  "Admin-Entered",
  "In Photo",
  "Out Photo",
];

function rowToCells(r: ExportRow): (string | number)[] {
  return [
    r.date,
    fmtTime(r.firstIn),
    fmtTime(r.lastOut),
    r.totalHours > 0 ? Math.round(r.totalHours * 100) / 100 : "",
    statusLabel(r.status, r.holidayName),
    r.adminEntered ? "Yes" : "",
    r.inPhotoUrl ?? "",
    r.outPhotoUrl ?? "",
  ];
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: ExportRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) lines.push(rowToCells(r).map(csvEscape).join(","));
  return lines.join("\n");
}

function toXlsx(
  employee: { fullName: string; employeeCode: string },
  periodStart: string,
  periodEnd: string,
  rows: ExportRow[],
): Uint8Array {
  const aoa = [
    [`In-Out — Attendance Export`],
    [`${employee.fullName} (${employee.employeeCode})`],
    [`${periodStart} to ${periodEnd}`],
    [],
    HEADERS,
    ...rows.map(rowToCells),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 11 },
    { wch: 22 },
    { wch: 13 },
    { wch: 30 },
    { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Attendance");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

async function toPdf(
  employee: { fullName: string; employeeCode: string },
  periodStart: string,
  periodEnd: string,
  rows: ExportRow[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 792; // US Letter landscape
  const pageHeight = 612;
  const margin = 36;
  const colX = [margin, 130, 200, 270, 340, 470, 550, 670];
  const colWidths = [90, 65, 65, 65, 125, 75, 115, 122];
  const rowHeight = 16;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function drawHeader() {
    page.drawText("In-Out — Attendance Export", { x: margin, y, size: 14, font: bold });
    y -= 18;
    page.drawText(`${employee.fullName} (${employee.employeeCode})`, {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= 14;
    page.drawText(`${periodStart} to ${periodEnd}`, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 20;
    HEADERS.forEach((h, i) => {
      page.drawText(h, { x: colX[i], y, size: 8, font: bold });
    });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= rowHeight;
  }

  drawHeader();

  for (const r of rows) {
    if (y < margin + rowHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
    }
    const cells = rowToCells(r).map(String);
    cells.forEach((cellText, i) => {
      const maxChars = Math.floor(colWidths[i] / 4.3);
      const truncated =
        cellText.length > maxChars ? cellText.slice(0, maxChars - 1) + "…" : cellText;
      page.drawText(truncated, { x: colX[i], y, size: 7.5, font });
    });
    y -= rowHeight;
  }

  return doc.save();
}
