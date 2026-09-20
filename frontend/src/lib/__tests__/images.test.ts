import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getImageUrl } from '../images';

// Regression: the QR order page used raw relative image paths
// (/uploads/<uuid>.jpg), so the browser requested them from the frontend
// origin and received the SPA's index.html instead of an image.

describe('getImageUrl', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080/api/v1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes backend base URL for relative /uploads paths', () => {
    expect(getImageUrl('/uploads/abc.jpg')).toBe(
      'http://localhost:8080/uploads/abc.jpg',
    );
  });

  it('prefixes backend base URL for relative /images paths', () => {
    expect(getImageUrl('/images/steak.png')).toBe(
      'http://localhost:8080/images/steak.png',
    );
  });

  it('leaves absolute URLs untouched', () => {
    expect(getImageUrl('https://cdn.example.com/x.jpg')).toBe(
      'https://cdn.example.com/x.jpg',
    );
  });

  it('passes through other relative paths unchanged', () => {
    expect(getImageUrl('assets/picture.webp')).toBe('assets/picture.webp');
  });

  it('returns null for empty input', () => {
    expect(getImageUrl(null)).toBeNull();
    expect(getImageUrl(undefined)).toBeNull();
    expect(getImageUrl('')).toBeNull();
  });
});
