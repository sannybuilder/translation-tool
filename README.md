# Sanny Builder Translation Tool

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
- **ANSI Encoding Support**: Proper handling of special characters used in translation files
- **Sticky Section Headers**: Easy navigation through large translation files
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes
- **Session Management**: Automatic local autosave with resume-on-reload banner and a "Last saved" indicator

## Usage

### GitHub Mode (Default)

1. The app automatically loads the list of available translations from GitHub
2. Select a language from the dropdown to start editing
3. Edit translations directly in the text fields
4. The Download button becomes active when changes are detected
5. Click "Download" to download the modified .ini file

### Local Files Mode

1. Switch the Source to "Local" in the header.
2. Use the header file pickers or the Local Translations area to open the English (base) and translation `.ini` files, or drag-and-drop `.ini` files.
3. Edit translations directly in the text fields.
4. The Download button becomes active when changes are detected.
5. Click "Download" to download the edited `.ini` file.

## Session Management

- The app automatically saves your work to your browser as you type. A "Auto saved" indicator appears in the header.
- If you close or refresh the page with unsaved work, a resume banner will appear next time. Choose "Resume Session" to restore your last state, or "Start Fresh" to discard it.
- Resuming opens in Local mode to avoid loading remote content; your previous base and translation data are restored.
- Downloading (Save) clears the session. You can also discard it via the banner.
- Your data never leaves your browser. Sessions are specific to the same device and browser; clearing site data removes them.

## License

The MIT License.