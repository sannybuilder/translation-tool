# Sanny Builder Translation Editor

A web-based translation editor for Sanny Builder language files. This application supports both loading files from the [sannybuilder/translations](https://github.com/sannybuilder/translations) GitHub repository and working with local INI files.

## Features

- **Dual Source Support**: 
  - **GitHub Mode**: Automatically fetches all available translation files from the official Sanny Builder translations repository
  - **Local Mode**: Load and edit INI files from your computer
- **Real-time Comparison**: Side-by-side view of English source text and translations
- **Translation Status Tracking**: Visual indicators for:
  - Missing translations (red)
  - Identical to English (orange) 
  - Translated (green)
- **Progress Statistics**: Track overall translation progress with completion percentage
- **Export Functionality**: Download edited translations as properly formatted .ini files
- **Windows-1252 Encoding Support**: Proper handling of special characters used in translation files
- **Sticky Section Headers**: Easy navigation through large translation files
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository:
```bash
git clone [repository-url]
cd translation-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### GitHub Mode (Default)

1. The app automatically loads the list of available translations from GitHub
2. Select a language from the dropdown to start editing
3. Edit translations directly in the text fields
4. The save button becomes active when changes are detected
5. Click "Save To File" to download the modified .ini file

### Local Files Mode

1. Click the "Local Files" button in the header to switch modes
2. Click "Choose File" next to "English (Base)" to load your english.ini file
3. Click "Choose File" next to "Translation" to load the translation file you want to edit
4. Edit translations directly in the text fields
5. The save button becomes active when changes are detected
6. Click "Save To File" to download the modified .ini file with the same name as your input file

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is open source and available under the MIT License.