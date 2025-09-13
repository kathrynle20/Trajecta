# Trajecta

A Node.js Express web application with clear frontend/backend separation.

## Project Structure

```
├── backend/                 # Backend server code
│   ├── routes/             # Express route handlers
│   ├── views/              # Jade/Pug templates
│   └── app.js              # Express application setup
├── frontend/               # Frontend source code
│   ├── assets/             # Source assets
│   │   ├── css/           # Stylesheets
│   │   ├── js/            # JavaScript files
│   │   └── images/        # Image assets
│   └── templates/          # Template copies (for reference)
├── public/                 # Built/served static assets
│   ├── css/               # Compiled CSS
│   ├── js/                # Compiled JavaScript
│   └── images/            # Optimized images
├── scripts/               # Build and utility scripts
├── bin/                   # Executable scripts
└── node_modules/          # Dependencies
```

## Development

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build frontend assets:
   ```bash
   npm run build
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build frontend assets to public directory
- `npm run build:watch` - Watch frontend assets and rebuild on changes

### Development Workflow

1. **Frontend Development**: Edit files in `frontend/assets/`
2. **Backend Development**: Edit files in `backend/`
3. **Templates**: Edit Jade templates in `backend/views/`
4. **Build**: Run `npm run build` to copy frontend assets to `public/`

### File Organization

- **Backend**: All server-side code is in the `backend/` directory
- **Frontend**: All client-side source code is in the `frontend/` directory
- **Public**: Served static assets are in the `public/` directory (generated)
- **Templates**: Jade templates are in `backend/views/` and referenced copies in `frontend/templates/`

This structure provides clear separation between frontend and backend concerns while maintaining the Express.js conventions.
