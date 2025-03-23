# Contributing to X.com Enhanced Image Gallery

Thank you for considering contributing to the X.com Enhanced Image Gallery project! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PiesP/xcom-enhanced-gallery.git
   cd xcom-enhanced-gallery
   ```

2. Install Node.js (if not already installed).

3. No additional dependencies are required as this project is designed to be lightweight and self-contained.

## Project Structure

- `src/`: Source code files
  - `components/`: UI components for the image viewer
  - `core/`: Core functionality modules
  - `utils/`: Utility functions
  - `tweet/`: Twitter/X.com data extraction
  - `I18N/`: Internationalization support
    - `locales/`: Translation files (JSON)
    - `utils/`: I18N utility functions
  - `*.js`: Core and configuration files
- `dist/`: Distribution directory where the built UserScript is placed
- `build.js`: Build script that combines source files into the final UserScript
- `.github/workflows/`: GitHub Actions workflow definitions

## Building the Project

To build the UserScript manually:

```bash
node build.js
# or use the npm script
npm run build
```

This will generate `dist/xcom-enhanced-gallery.user.js` which is the file that users can install in their UserScript manager.

You can also use the development script that provides immediate feedback:

```bash
npm run dev
```

## GitHub Actions Workflows

This project uses GitHub Actions for automated builds and releases:

1. **Build Workflow**: Automatically builds the UserScript when changes are pushed to the master branch.
2. **Release Workflow**: Creates a new release when version is bumped in package.json.

The workflows are defined in the `.github/workflows/` directory.

## Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the source code in the `src/` directory.

3. Test your changes by building the UserScript and installing it locally.

4. If adding new features, consider adding appropriate translations to the locale files in `src/I18N/locales/`.

5. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

6. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request on GitHub.

## Versioning

When making significant changes:

1. Update the version in both `package.json` and in the UserScript metadata in `build.js`:
   ```json
   // package.json
   {
     "version": "x.y.z"
   }
   ```

   ```javascript
   // build.js - in the METADATA variable
   // @version      x.y.z
   ```

2. Include "bumped version" in your commit message to trigger the release workflow:
   ```bash
   git commit -m "Feature: Add new functionality, bumped version to x.y.z"
   ```

## Code Style Guidelines

- Use ES6 module syntax (import/export)
- Follow consistent indentation (2 spaces)
- Add comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Organize related functionality into appropriate directories

## Adding Translations

This project supports multiple languages. To add or modify translations:

1. Navigate to `src/I18N/locales/`
2. Edit an existing locale file or create a new one following the JSON format of other locale files
3. Make sure all translation keys are consistent across locale files

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
