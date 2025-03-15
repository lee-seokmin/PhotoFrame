export interface PhotoMetadata {
  Make: string | null;
  Model: string | null;
  ExposureTime: number | null;
  ISO: number | null;
  FNumber: number | null;
  FocalLength: number | null;
  DateTimeOriginal: string | null;
}

export interface ImageData {
  dataUrl: string;
  type: string;
  name: string;
} 