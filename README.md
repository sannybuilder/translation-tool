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

## Usage

### GitHub Mode (Default)

1. The app automatically loads the list of available translations from GitHub
2. Select a language from the dropdown to start editing
3. Edit translations directly in the text fields
4. The save button becomes active when changes are detected
5. Click "Save" to download the modified .ini file

### Local Files Mode

1. Switch the Source to "Local" in the header.
2. Use the header file pickers or the Local Translations area to open the English (base) and translation `.ini` files, or drag-and-drop `.ini` files.
3. Edit translations directly in the text fields.
4. The Save button becomes active when changes are detected.
5. Click "Save" to download the edited `.ini` file.

## License

The MIT License.