# ADR-0001: Static Deployment Architecture

**Status**: Accepted
**Date**: 2025-12-16
**Deciders**: User, Claude

## Context

GeoRhythm needs a deployment strategy. The game is a client-side Phaser 3 application with static assets (levels, audio, sprites). We need to decide how to host and serve the application.

## Decision

Adopt **pure static hosting** (Option 1) for initial deployment.

### What This Means

- **Hosting**: Vercel, Netlify, GitHub Pages, or Cloudflare Pages
- **Build Output**: Vite produces static files in `dist/`
- **Assets**: All levels, audio, and sprites served from same origin
- **Level Files**: JSON files in `public/levels/`, copied to `dist/levels/` at build
- **No Backend**: No server-side code, database, or API

### Asset Organization

```
public/
├── levels/
│   ├── index.json          # Level manifest (list of available levels)
│   ├── stereo-madness.json # Level data
│   └── ...
├── assets/
│   ├── audio/
│   │   ├── stereo-madness.mp3
│   │   └── ...
│   └── sprites/
│       ├── blocks.png
│       └── ...
```

### LevelLoader Design Implications

1. **Manifest-based discovery**: Fetch `levels/index.json` to get available levels
2. **Relative URLs**: Use relative paths (`/levels/foo.json`) not absolute
3. **No authentication**: All assets publicly accessible
4. **Build-time bundling**: Levels included in deployment artifact

## Consequences

### Positive

- Zero infrastructure cost (free tiers available)
- Simple CI/CD pipeline (push to deploy)
- Global CDN distribution
- No server maintenance
- Fast iteration during development

### Negative

- Adding levels requires rebuild and redeploy
- No user-generated content without separate solution
- No server-side leaderboards (localStorage only for now)
- All assets must fit in deployment size limits

### Neutral

- CORS not needed (same-origin)
- No environment-specific API URLs to manage

## Migration Path

If we later need dynamic levels or user content (Option 2/3):

1. LevelLoader already fetches JSON via URL
2. Change base URL from relative to CDN/API endpoint
3. Add manifest endpoint for dynamic level discovery
4. Existing level format remains unchanged

## Alternatives Considered

### Option 2: Static + External CDN

Separate asset hosting (S3, R2, Bunny). Rejected for now - adds complexity without immediate benefit.

### Option 3: Full Backend

Server for user accounts, custom levels, leaderboards. Rejected - premature for current phase.

## References

- Vite static deployment: https://vitejs.dev/guide/static-deploy
- Phaser asset loading: https://phaser.io/tutorials/getting-started-phaser3
