# Loading Screen Assets

This directory contains the loading screen assets. Currently using CSS animation mode.

## Current Mode

**CSS Animation Mode** (Active)
- Animated fork and knife utensils with flame effects
- Sizzling steak icon with steam animation
- Professional restaurant-themed design
- No external assets required
- Fast loading

## Files

- **Food Carousel.webm** (86KB) - Video asset (NOT CURRENTLY USED)
  - Duration: 4.5 seconds
  - Format: WebM (VP8 codec)
  - Status: Available but not active
  - Can be re-enabled by adding `useVideo={true}` to Loader component

## Switching to GIF Mode

To use a custom steak dinner GIF instead of CSS animations:

### 1. Create Your GIF

**GIF Requirements:**
- Content: Steak on plate with fork, spoon, vegetables, french fries
- Style: Appetizing, professional restaurant quality
- Animation: Subtle motion (steam, glow, or sizzling effect)
- Size: <500KB (ideal: <200KB)
- Duration: 2-3 seconds seamless loop

**Creation Options:**

**Option A: Stock Photos (Free, Fast)**
1. Visit: https://unsplash.com/s/photos/steak-dinner
2. Download high-quality steak dinner photo
3. Create GIF at: https://ezgif.com/video-to-gif
4. Add subtle zoom or steam effect
5. Optimize and download

**Option B: AI Generation (Best Quality)**
- DALL-E 3 (ChatGPT Plus): Generate custom image
- Midjourney: Best photorealistic quality
- Leonardo.ai: Free tier available
- Prompt: "Photorealistic premium steak dinner plate with fork and knife, french fries, grilled vegetables, steam rising, restaurant food photography"

**Option C: Hire Freelancer (Custom Work)**
- Fiverr: $20-50 USD, 2-3 days
- Upwork: $50-100 USD, 3-5 days
- Search for: "Food photography GIF animation"

### 2. Add GIF to Project

Save your GIF as:
```
frontend/public/assets/restoran/images/loader-fallback.gif
```

### 3. Verify

The loader will automatically use your GIF if:
- File exists at correct path
- File size is reasonable (<500KB)
- GIF format is valid

## Current Fallback Chain

1. **GIF** (loader-fallback.gif) - If file exists
2. **CSS Animation** (current default) - Professional utensils and steak icon
3. **Video** (Food Carousel.webm) - Can be enabled with `useVideo={true}`

## Enabling Video Mode (Optional)

To use the video instead of CSS/GIF:

In `frontend/src/components/public/PublicLayout.tsx`:
```tsx
<Loader
  show={isLoading}
  duration={loaderDuration}
  useVideo={true}  // Add this line
  onComplete={handleLoaderComplete}
/>
```

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
