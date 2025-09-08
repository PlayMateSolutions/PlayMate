# PlayMate Backend

This folder contains the backend code for the PlayMate Sports Membership Management App. The backend is implemented as a Google Apps Script project, exposing APIs for the frontend (Ionic/Angular) and other integrations.

## Structure

- **ApiService.js**: Main API entry point. Handles routing, authentication (JWT/OAuth), and exposes endpoints for members, attendance, payments, sports, settings, and sports clubs.
- **Attendance.js**: Logic for recording and retrieving attendance data.
- **Code.js**: (Purpose depends on project, often contains main script logic or entry point helpers.)
- **Config.js**: Configuration and constants for the backend.
- **Master.js**: Likely contains master data or utility functions shared across modules.
- **Members.js**: Handles member management (CRUD operations, member lookups, etc.).
- **Payments.js**: Handles payment records, summaries, and payment status.
- **UI.js**: UI-related logic for Google Sheets custom menus or dialogs (if used).
- **Utils/Utilities.js**: Utility/helper functions used throughout the backend.
- **Tests/**: Contains test scripts for backend logic.
  - **Test.js**: General backend tests.
  - **TestApi.js**: API endpoint tests.

## Key Features
- Google Apps Script-based API for Google Sheets data
- JWT and OAuth token authentication (with local JWT parsing for performance)
- Endpoints for:
  - Member management
  - Attendance tracking
  - Payment management
  - Sports and club management
  - Settings
- Concurrency control using script locks
- Modular code organization for maintainability

## Deployment
- Use the [Google Apps Script Editor](https://script.google.com/) or the `clasp` CLI to push and deploy code.
- See project root README or deployment instructions for details.

### Using clasp (Command Line)

1. Install clasp globally (if not already):
   ```sh
   npm install -g @google/clasp
   ```
2. Authenticate with your Google account:
   ```sh
   clasp login
   ```
3. Push your local code to the Apps Script project:
   ```sh
   clasp push
   ```
4. Deploy a new version interactively (choose deployment type and description):
   ```sh
   clasp deploy -i
   ```
   - This will prompt you to select the deployment type (e.g., Web App) and enter a description.
5. To update an existing deployment, use the deployment ID:
   ```sh
   clasp deploy -i DEPLOYMENT_ID
   ```

- Make sure your `clasp.json` is configured to point to your Apps Script project.
- For more details, see the [clasp documentation](https://github.com/google/clasp).

## Notes
- This backend is designed to work with the PlayMate frontend (Ionic/Angular) and expects requests in a specific format.
- Sensitive actions require a valid Google OAuth or JWT access token.
- For local development, a dev token can be used (see `validateAuthToken`).

---
For more details, see inline comments in each file.
