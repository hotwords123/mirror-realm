# Project Role: Senior Creative Technologist

You are an expert Vue 3 developer. Build "MirrorRealm" - a performant web tool for image/GIF symmetry processing.

## 1. Tech Stack & Dependencies

- Framework: Vue 3 (SFC, <script setup>, TypeScript)
- Build/Bundler: Vite + pnpm
- Styling: Tailwind CSS v4
- State Management: Pinia
- GIF Processing:
  - `omggif`: Use its `GifReader` for high-precision decoding of GIF frames.
  - `gif.js`: Use for encoding processed frames back to GIF with Web Workers support.
- Icons: `lucide-vue-next`

## 2. Core Logic: The 8-Way Symmetry

Implement 8 transformation modes. For each mode, define a "Source Area" and "Target Areas":

1.  **Left-to-Right**: Keep Left 1/2, Mirror to Right.
2.  **Right-to-Left**: Keep Right 1/2, Mirror to Left.
3.  **Top-to-Bottom**: Keep Top 1/2, Mirror to Bottom.
4.  **Bottom-to-Top**: Keep Bottom 1/2, Mirror to Top.
5.  **TL-to-All**: Keep Top-Left 1/4, Mirror to TR, BL, BR.
6.  **TR-to-All**: Keep Top-Right 1/4, Mirror to TL, BL, BR.
7.  **BL-to-All**: Keep Bottom-Left 1/4, Mirror to TL, TR, BR.
8.  **BR-to-All**: Keep Bottom-Right 1/4, Mirror to TL, TR, BL.

## 3. Interactive UX: The "Smart Grid" Selection

- In the `ImageEditor.vue`, overlay a transparent grid over the image.
- **Interaction Model**:
  - **Hover**: Previews the symmetry mode (Ghost Preview).
  - **Click**: Selects/Locks the active symmetry mode.
- **Hit-box Logic**:
  - Calculate the distance from the mouse cursor to the center point of each mode's "Source Area".
  - The mode with the shortest distance is activated for preview.
  - This ensures smooth transitions even in the center of the image.
- **Visual Feedback**:
  - On hover, highlight the "Source Area" with a semi-transparent overlay (Purple for preview, Blue for active).
  - **Ghost Preview**: Show a real-time preview by overlaying mirrored copies of the source image.
    - Use `overflow: hidden` containers to crop the source image.
    - Use CSS `transform: scale(...)` to mirror the image within the container.
    - Ensure `clip-path` is used on the main image to hide the "Target Areas" during preview, allowing the Ghost layers to shine through without transparency stacking issues.
  - **Transparency Support**: Use a checkerboard background (`.bg-checkerboard`) for the editor and result preview to visualize transparent areas.

## 4. Processing Pipeline

### GIF Handling

1. **Decode**: Use `omggif` to extract frames and `delay` durations.
2. **Transform**: For each frame:
   - Create an offscreen Canvas.
   - **Clear** the canvas (`ctx.clearRect`) to prevent transparency stacking.
   - Draw the source part.
   - Use `context.scale()` and `drawImage()` to fill the target parts.
3. **Encode**: Feed processed canvases into `gif.js`. Ensure `workerScript` is correctly configured in Vite to use public assets.
4. **Export**: Generate a Blob URL for download.

### Static Image Handling

- Similar to GIF but only processes a single frame. Faster and direct.

## 5. Engineering Standards

- **Clean Code**: Logic for canvas manipulation should live in `/src/utils/canvas-engine.ts`.
- **Memory Management**: Explicitly `revokeObjectURL` when a new image is uploaded or the component is destroyed.
- **UX**: Show a loading spinner with percentage during GIF encoding.
- **Styling**: Use a clean, dark-themed UI (Glassmorphism style) using Tailwind.
- **Deployment**: Use GitHub Actions to deploy to GitHub Pages.

## 6. Project Structure

- `src/components/ImageEditor.vue`: Main interaction logic (Grid, Ghost Preview).
- `src/utils/canvas-engine.ts`: Core image processing logic (GIF/Static).
- `src/stores/editor.ts`: State management.

## 7. Quality Assurance

- **Linting & Type Checking**: After every code edit, run the `get_errors` tool to check for linter and TypeScript errors in the modified files. Fix any reported issues immediately.
