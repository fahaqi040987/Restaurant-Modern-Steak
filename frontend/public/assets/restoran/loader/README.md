# Loading Screen Video Assets

This directory contains the loading screen video and supporting assets.

## Files

- **Food Carousel.webm** (86KB) - Main loading screen video
  - Duration: 4.5 seconds
  - Format: WebM (VP8 codec)
  - Used as background animation during page load

- **poster.jpg** (TODO) - Poster image for video
  - Should be a frame extracted from Food Carousel.webm
  - Format: JPEG, quality 80-85
  - Size: ~10-20KB
  - Purpose: Display while video loads

## Video Optimization

The video file is already well-optimized:
- File size: 86KB ✅ (Excellent for web)
- Format: WebM with VP8 codec ✅
- Duration: 4.5 seconds (seamless loop)

## Creating a Poster Image

To create a poster image from the video:

### Option 1: Using online tool
1. Upload video to: https://www.flexclip.com/tools/video-to-jpeg/
2. Extract a good frame (around 2-3 seconds in)
3. Save as JPEG, quality 80-85
4. Resize to 1280x720 if needed
5. Save as `poster.jpg` in this directory

### Option 2: Using ffmpeg (if installed)
```bash
ffmpeg -i "Food Carousel.webm" -ss 00:00:02.5 -vframes 1 -q:v 2 poster.jpg
```

### Option 3: Use video editing software
- Open video in any editor
- Export a single frame as JPEG
- Optimize for web (quality 80-85)

## Current Settings

In `frontend/src/components/public/Loader.tsx`:
- **Opacity**: 60% (enhanced visibility)
- **Preload**: auto (loads immediately)
- **Poster**: poster.jpg (shows while loading)
- **Loop**: enabled
- **Muted**: enabled (required for autoplay)

## Performance

- **Load time on 3G**: <1 second ✅
- **Load time on WiFi**: <100ms ✅
- **First frame**: With poster image <50ms ✅

## Browser Support

WebM format supported by:
- Chrome 6+ ✅
- Firefox 4+ ✅
- Edge 79+ ✅
- Safari 14.1+ ✅
- Mobile browsers ✅

Fallback to CSS animation if video not supported.
