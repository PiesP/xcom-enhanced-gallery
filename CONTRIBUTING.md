# Contributing to X.com Enhanced Image Gallery

Thank you for considering contributing to the X.com Enhanced Image Gallery project! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PiesP/xcom-enhanced-gallery.git
   cd xcom-enhanced-gallery
   ```

2. Install Node.js (if not already installed).

3. No additional dependencies are required as this project is designed to be lightweight.

## Project Structure

- `src/`: Source code files
  - `components/`: UI components
  - `*.js`: Core files
- `dist/`: Distribution directory where the built UserScript is placed
- `build.js`: Build script that combines source files into the final UserScript

## Building the Project

To build the UserScript manually:

```bash
node build.js
```

This will generate `dist/xcom-enhanced-gallery.user.js` which is the file that users can install in their UserScript manager.

## GitHub Actions Workflows

This project uses GitHub Actions for automated builds and releases:

1. **Build Workflow**: Automatically builds the UserScript when changes are pushed to the master branch.
2. **Release Workflow**: Creates a new release when version is bumped in package.json.

## Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the source code in the `src/` directory.

3. Test your changes by building the UserScript and installing it locally.

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub.

## Versioning

When making significant changes:

1. Update the version in `package.json`:
   ```json
   {
     "version": "x.y.z"
   }
   ```

2. Include "bumped version" in your commit message to trigger the release workflow:
   ```bash
   git commit -m "Feature: Add new functionality, bumped version to x.y.z"
   ```

## Code Style Guidelines

- Use ES6 module syntax
- Follow consistent indentation (2 spaces)
- Add comments for complex logic
- Use meaningful variable and function names

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
