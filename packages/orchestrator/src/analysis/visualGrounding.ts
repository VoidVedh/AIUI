import sharp from "sharp";

export interface GridDimensions {
  cols: number;
  rows: number;
}

export interface BoundingBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class VisualGrounding {
  public static readonly DEFAULT_COLS = 8;
  public static readonly DEFAULT_ROWS = 6;
  public static readonly COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  /**
   * Overlays a labeled 8x6 coordinate grid onto the screenshot.
   * This anchors vision models spatially and prevents coordinate hallucination.
   */
  public static async generateGridOverlay(
    imageBuffer: Buffer,
    cols = VisualGrounding.DEFAULT_COLS,
    rows = VisualGrounding.DEFAULT_ROWS
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1280;
    const height = metadata.height || 800;

    const colWidth = width / cols;
    const rowHeight = height / rows;

    let svgLines = "";
    let svgLabels = "";

    // Vertical grid lines
    for (let c = 1; c < cols; c++) {
      const x = Math.round(c * colWidth);
      svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(239, 68, 68, 0.45)" stroke-width="1.5" stroke-dasharray="4,4" />`;
    }

    // Horizontal grid lines
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * rowHeight);
      svgLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(239, 68, 68, 0.45)" stroke-width="1.5" stroke-dasharray="4,4" />`;
    }

    // Cell labels in each quadrant
    for (let r = 0; r < rows; r++) {
      const rowLabel = `${r + 1}`;
      for (let c = 0; c < cols; c++) {
        const colLabel = VisualGrounding.COL_LABELS[c] || `C${c}`;
        const cellTag = `${colLabel}${rowLabel}`;
        const tagX = Math.round(c * colWidth + 8);
        const tagY = Math.round(r * rowHeight + 18);

        svgLabels += `
          <rect x="${tagX - 4}" y="${tagY - 14}" width="28" height="18" rx="4" fill="rgba(15, 23, 42, 0.75)" />
          <text x="${tagX}" y="${tagY}" font-family="monospace, sans-serif" font-size="12" font-weight="bold" fill="#38BDF8">${cellTag}</text>
        `;
      }
    }

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${svgLines}
        ${svgLabels}
      </svg>
    `;

    const overlayBuffer = Buffer.from(svg);
    const outputBuffer = await sharp(imageBuffer)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .png({ quality: 100 })
      .toBuffer();

    return { buffer: outputBuffer, width, height };
  }

  /**
   * Crops a region from the image buffer with safe bounds clamping.
   */
  public static async cropRegion(
    imageBuffer: Buffer,
    box: BoundingBoxRect,
    imageWidth?: number,
    imageHeight?: number
  ): Promise<Buffer> {
    const meta = imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : await sharp(imageBuffer).metadata();
    const maxWidth = meta.width || 1280;
    const maxHeight = meta.height || 800;

    let left = Math.max(0, Math.min(maxWidth - 10, Math.round(box.x)));
    let top = Math.max(0, Math.min(maxHeight - 10, Math.round(box.y)));
    let width = Math.max(10, Math.min(maxWidth - left, Math.round(box.width)));
    let height = Math.max(10, Math.min(maxHeight - top, Math.round(box.height)));

    if (width <= 0) width = Math.min(100, maxWidth - left);
    if (height <= 0) height = Math.min(100, maxHeight - top);

    return sharp(imageBuffer)
      .extract({ left, top, width, height })
      .png({ quality: 100 })
      .toBuffer();
  }

  /**
   * Translates grid coordinate expressions like "A1:D6" or "E1:H6" into pixel bounding boxes.
   */
  public static parseGridCellRange(
    rangeStr: string,
    totalWidth: number,
    totalHeight: number,
    cols = VisualGrounding.DEFAULT_COLS,
    rows = VisualGrounding.DEFAULT_ROWS
  ): BoundingBoxRect | null {
    if (!rangeStr) return null;
    const parts = rangeStr.trim().toUpperCase().split(":");
    if (parts.length === 0) return null;

    const startCell = parts[0];
    const endCell = parts.length > 1 ? parts[1] : parts[0];

    const startColLetter = startCell.charAt(0);
    const startRowNum = parseInt(startCell.slice(1), 10);
    const endColLetter = endCell.charAt(0);
    const endRowNum = parseInt(endCell.slice(1), 10);

    const startColIndex = VisualGrounding.COL_LABELS.indexOf(startColLetter);
    const endColIndex = VisualGrounding.COL_LABELS.indexOf(endColLetter);

    if (startColIndex === -1 || isNaN(startRowNum)) return null;

    const validEndCol = endColIndex !== -1 ? endColIndex : startColIndex;
    const validEndRow = !isNaN(endRowNum) ? endRowNum : startRowNum;

    const colWidth = totalWidth / cols;
    const rowHeight = totalHeight / rows;

    const x = Math.round(startColIndex * colWidth);
    const y = Math.round((startRowNum - 1) * rowHeight);
    const width = Math.round((validEndCol - startColIndex + 1) * colWidth);
    const height = Math.round((validEndRow - startRowNum + 1) * rowHeight);

    return { x, y, width, height };
  }
}
