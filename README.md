# flusso - Modern RSS Reader

A fast, privacy-focused, and highly customizable RSS reader built for the modern web and mobile devices.

## Features

- **Smart Feed Management**: Add RSS/Atom feeds by URL or import your existing subscriptions via OPML.
- **Distraction-Free Reading**: Full article content extraction using Mozilla's Readability for a clean, consistent reading experience.
- **Intelligent Read Status**: Articles are automatically marked as read as you scroll them to the top of the screen.
- **AMOLED Optimized**: Includes a "Pure Black" theme option to save battery on OLED displays.
- **Deep Customization**:
  - Themes: Light, Dark, System, and Pure Black.
  - Typography: Sans, Serif, and Mono fonts with adjustable sizes (Small to X-Large).
  - Layout: Choose how images are displayed (None, Small, or Large).
  - Gestures: Customizable swipe actions for marking as read or favoriting.
- **Media Integration**: Built-in support for audio and video content found within articles.
- **Offline First**: All your feeds and articles are stored locally on your device using IndexedDB.
- **Native Experience**: Powered by Capacitor for high performance on Android and iOS.

## Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Core Logic**: Capacitor (Native APIs), @mozilla/readability (Content Extraction), idb-keyval (Storage)
- **Styling**: Modern Tailwind 4.0 configuration

## Recent Updates

- **AMOLED Theme**: Added "Pure Black" mode for better contrast and battery life.
- **Smart Scrolling**: Refined the "read" logic to trigger only when articles reach the top of the viewport.
- **UI Refinement**: Removed unnecessary sharing and external link buttons for a cleaner reading interface.
- **Performance**: Optimized feed fetching and removed legacy AI summarization for a faster, more focused experience.
- **Build System**: Improved GitHub Actions for faster Android APK generation.
