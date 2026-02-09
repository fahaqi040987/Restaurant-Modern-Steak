# Loader Image Assets

This directory contains image assets for the loading screen.

## Required Files

### Video Poster (Required for video mode)
- **loader-poster.jpg** - Static image shown while video loads
  - Resolution: 1280x720 or 1920x1080
  - File size: <100KB
  - Content: appealing steak restaurant scene

### GIF Fallback (Optional but recommended)
- **loader-fallback.gif** - Animated GIF for browsers without video support
  - Resolution: 1280x720 or smaller
  - Duration: 2-3 seconds (looping)
  - File size: <1MB
  - Content: simplified animation of steak cooking

## Creating the Poster Image

### Option 1: Use Existing Restaurant Photo
- Select high-quality photo from restaurant
- Show sizzling steak or elegant dining scene
- Add text overlay: "Steak Kenangan"
- Apply dark overlay for text readability

### Option 2: Create Custom Poster
- Use design tools (Canva, Adobe Express)
- Template: Dark, elegant, premium
- Add restaurant name in Pacifico font
- Include flame or cooking imagery

### Option 3: Extract from Video
- Take a frame from the loading video
- Ensure it's an appealing visual
- Optimize compression

## Creating the GIF Fallback

### Option 1: Convert from Video
```bash
ffmpeg -i steak-loader.mp4 -vf "fps=10,scale=480:-1" \
  -f gif loader-fallback.gif
```

### Option 2: Simplified Animation
- Use online GIF makers (GIFs.com, Ezgif)
- Create simple frame-by-frame animation
- Focus on flame/grill effects
- Keep file size under 1MB

### Option 3: Use Existing GIF
- Search for "steak cooking GIF" or "grilling GIF"
- Ensure it matches restaurant theme
- Check license and attribution requirements

## Image Optimization

### Optimize JPEG:
```bash
jpegoptim --max=80 --strip-all loader-poster.jpg
```

### Optimize GIF:
```bash
gifsicle -O3 --lossy=30 --colors 64 loader-fallback.gif
```

### Convert WebP (modern browsers):
```bash
cwebp -q 80 loader-poster.jpg -o loader-poster.webp
```

## File Size Guidelines

- **Poster image**: <100KB (JPEG, quality 80-85)
- **GIF fallback**: <1MB (optimized, 64 colors)
- **WebP version**: <50KB (if used)

## Testing

Test images before deployment:
1. Check file size
2. Verify quality acceptable
3. Test load time
4. Check in multiple browsers
5. Test on mobile devices (3G connection)
