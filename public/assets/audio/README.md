# Audio Assets

This directory contains audio files for GeoRhythm.

## Structure

```
audio/
├── README.md           # This file
├── 1.mp3               # Test level music (songId: 1)
└── sfx/
    ├── jump.wav        # Jump sound effect
    ├── death.wav       # Death sound effect
    ├── click.wav       # UI click sound
    └── complete.wav    # Level complete sound
```

## Audio Requirements

### Music Files
- Format: MP3 or OGG (MP3 recommended for compatibility)
- Sample rate: 44.1kHz
- Naming: `{songId}.mp3` where songId matches level metadata

### Sound Effects
- Format: WAV (for low latency)
- Sample rate: 44.1kHz
- Duration: Short clips (< 1 second typical)

## Placeholder Audio

The game will function without audio files. When audio fails to load:
- Music sync falls back to time-based positioning
- Sound effects fail silently (no errors)

## Adding New Audio

1. Add music files as `{songId}.mp3` in `/assets/audio/`
2. Add SFX files in `/assets/audio/sfx/`
3. Update level metadata to reference the correct songId
