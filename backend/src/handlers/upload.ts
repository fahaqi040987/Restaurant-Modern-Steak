import type { Context } from 'hono';
import { successResponse, errorResponse } from '../lib/response.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {
  // Ignore if already exists
}

// ── UploadImage ──────────────────────────────────────────────────────────────

export async function uploadImage(c: Context) {
  try {
    const formData = await c.req.parseBody();
    const file = formData['image'];

    if (!file || typeof file === 'string') {
      return errorResponse(c, 'No image file provided', 'missing_file', 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(c, `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`, 'file_too_large', 400);
    }

    // Read file buffer for MIME type detection
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect MIME type from magic bytes
    const mimeType = detectMimeType(buffer) || file.type;

    // Validate file type
    if (!ALLOWED_TYPES[mimeType]) {
      return errorResponse(c, 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP', 'invalid_file_type', 400);
    }

    // Generate UUID filename with proper extension
    const ext = ALLOWED_TYPES[mimeType] || path.extname(file.name || '').toLowerCase() || '.jpg';
    const newFilename = randomUUID() + ext;

    // Save file to disk
    const destPath = path.join(UPLOAD_DIR, newFilename);
    fs.writeFileSync(destPath, buffer);

    // Generate URL path
    const fileURL = '/uploads/' + newFilename;

    return successResponse(c, 'Image uploaded successfully', {
      filename: newFilename,
      url: fileURL,
      size: buffer.length,
      mime_type: mimeType,
    });
  } catch (err) {
    return errorResponse(c, 'Failed to upload image', (err as Error).message);
  }
}

// ── DeleteImage ──────────────────────────────────────────────────────────────

export async function deleteImage(c: Context) {
  const filename = c.req.param('filename');

  // Validate filename (prevent path traversal)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return errorResponse(c, 'Invalid filename', 'invalid_filename', 400);
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return errorResponse(c, 'File not found', 'not_found', 404);
  }

  try {
    fs.unlinkSync(filePath);
    return successResponse(c, 'Image deleted successfully');
  } catch {
    return errorResponse(c, 'Failed to delete file', 'delete_error');
  }
}

// ── Helper: Detect MIME type from magic bytes ──────────────────────────────

function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }

  return null;
}
