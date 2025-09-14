# Trajecta

A Node.js Express web application with clear frontend/backend separation.


<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/86b7688e-958e-41e8-9606-4dfaf8f5f868" />


## Website Preview

### Feed page
<img width="988" height="714" alt="Screenshot 2025-09-14 at 11 37 54 AM" src="https://github.com/user-attachments/assets/b08fcd10-9af5-4956-84e9-16eadf2f1431" />

### Find Friends
<img width="556" height="642" alt="Screenshot 2025-09-14 at 11 42 44 AM" src="https://github.com/user-attachments/assets/11fc1863-23d1-4698-a270-0eacdf3ee718" />

### User Profile
<img width="677" height="597" alt="Screenshot 2025-09-14 at 11 43 30 AM" src="https://github.com/user-attachments/assets/031464ff-c9fc-4a97-a337-45e9575ba0aa" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7288b72e-d395-444e-a83b-44c804a8980b" />



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
