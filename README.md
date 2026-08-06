# VoxPopuli - Live Polling

An interactive, real-time polling platform featuring live data visualization, Redux state management, and seamless real-time syncing. 

## Features

- **Live Polling**: Create dynamic polls with real-time feedback and visualization.
- **Rich Data Visualizations**: Enjoy beautiful, responsive charts (Bar, Pie) via Recharts.
- **Custom Theming**: Personalize each poll with custom accent colors and background images.
- **Sharing & Embedding**: Easily share polls using built-in QR codes, direct links, or generate iframe embed codes to add polls to your own website or Notion pages.
- **Privacy Controls**: Choose to hide poll results until the poll is officially closed to avoid swaying voters. Unlisted poll support is also available.
- **AI-Powered Generation**: Utilize Gemini to automatically generate compelling poll questions and options.
- **Real-time Syncing**: WebSockets built on Socket.io and Express for instantaneous cross-device vote counts.
- **Commenting System**: Users can comment on polls and share their thoughts.

## Tech Stack

- **Frontend**: React 19, React Router, Redux Toolkit, Tailwind CSS, Framer Motion
- **Visuals & Icons**: Recharts, Lucide React, qrcode.react, Canvas Confetti
- **Backend**: Express, Socket.io, Google GenAI SDK

## Getting Started

### Prerequisites
Make sure you have Node.js and npm (or bun/yarn) installed on your machine. 

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (if required for Gemini features, copy `.env.example` to `.env` and fill in the values).

### Running the App

Start the development server:
```bash
npm run dev
```

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```
