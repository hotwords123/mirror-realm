# MirrorRealm 🪞

> A performant, client-side web tool for creating symmetrical art from images and GIFs.

MirrorRealm allows you to transform static images and animated GIFs using 8 different symmetry modes. It runs entirely in your browser using Web Workers and Canvas API, ensuring your files never leave your device.

## ✨ Features

- **8-Way Symmetry Modes**:
  - **Halves**: Left-to-Right, Right-to-Left, Top-to-Bottom, Bottom-to-Top.
  - **Quadrants**: Top-Left, Top-Right, Bottom-Left, Bottom-Right to All.
- **GIF Support**: Full frame-by-frame processing for animated GIFs.
- **Smart Grid Interaction**: Hover over the image to preview symmetry effects in real-time.
- **Ghost Preview**: Zero-latency preview using CSS transformations.
- **Privacy Focused**: 100% client-side processing. No server uploads.
- **Transparent Image Support**: Includes checkerboard background for easy editing of transparent assets.

## 🛠️ Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Script Setup, TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Image Processing**:
  - `omggif`: For GIF decoding.
  - `gif.js`: For GIF encoding (Web Workers).
  - Canvas API: For image manipulation.
- **Icons**: `lucide-vue-next`

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- pnpm (v10+ recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/hotwords123/mirror-realm.git
   cd mirror-realm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start the development server:

```bash
pnpm dev
```

### Build

Build for production:

```bash
pnpm build
```

The output will be in the `dist` directory.

## 📖 Usage

1. **Upload**: Drag & drop an image or GIF onto the drop zone.
2. **Select Mode**: Move your mouse over the image. The grid will highlight different "Source Areas" (e.g., Top-Left corner, Left Half).
3. **Preview**: Click to lock in a selection. The "Ghost Preview" shows exactly how the result will look.
4. **Generate**: Click the "Generate Mirror" button.
5. **Download**: Once processing is complete, download your new symmetrical creation.

## 📂 Project Structure

```
src/
├── assets/          # Static assets and global styles
├── components/      # Vue components (ImageEditor, DropZone, etc.)
├── stores/          # Pinia stores
├── utils/           # Core logic (CanvasEngine, GIF processing)
├── App.vue          # Main application entry
└── main.ts          # App initialization
```

## 🙏 Acknowledgements

Special thanks to **GitHub Copilot** and **Gemini 3 Pro** for their assistance in building this project.

## 📄 License

MIT
