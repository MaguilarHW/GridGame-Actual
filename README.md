# 🌾 Farm Grid Game 🌾

Pastel farm strategy game on a 5x5 grid built with React, Vite, and Electron.

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Electron App (Development)
```bash
npm run electron:dev
```

## Building for Distribution

### Build Web App
```bash
npm run build
```

### Build Electron App (macOS DMG)
```bash
npm run electron:build:dmg
```

This will:
1. Build the React/Vite app
2. Package it as an Electron app
3. Create a DMG file in the `release` directory

The DMG file will be located at: `release/GridGame-1.0.0.dmg`

### Build for Other Platforms

**macOS only:**
```bash
npm run electron:build:mac
```

**All platforms:**
```bash
npm run electron:build
```

## Distribution

After building, the DMG file can be distributed to users. They can:
1. Download the DMG file
2. Open it
3. Drag the app to their Applications folder
4. Launch the app from Applications

## Notes

- The app requires macOS to build DMG files
- For Windows/Linux builds, use the appropriate platform-specific commands
- Make sure to update the `version` in `package.json` before each release
