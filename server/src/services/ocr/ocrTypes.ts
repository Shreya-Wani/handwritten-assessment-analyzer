export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  pageNumber: number;
}

export interface OCRPageResult {
  pageNumber: number;
  width: number;
  height: number;
  blocks: OCRBlock[];
}

export interface OCRDocumentResult {
  totalPages: number;
  pages: OCRPageResult[];
}
