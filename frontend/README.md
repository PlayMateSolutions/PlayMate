# PlayMate Frontend

A modern gym and sports club management application built with Ionic Angular.

## 🏋️ About PlayMate

PlayMate is a comprehensive gym management system designed to streamline operations for fitness centers and sports clubs. The application provides an intuitive interface for managing members, tracking attendance, handling payments, and configuring club settings.

## 🚀 Features

- **Member Management**: Add, edit, and manage gym members with detailed profiles
- **Attendance Tracking**: Monitor member check-ins and attendance patterns
- **Payment Processing**: Handle membership fees and payment tracking
- **Settings Management**: Configure sports club settings and preferences
- **Google Authentication**: Secure login using Google Sign-In
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Progressive Web App**: Can be installed on devices for native-like experience

## 🛠️ Technology Stack

- **Framework**: Ionic 8 + Angular 19
- **Language**: TypeScript
- **Styling**: SCSS with Ionic components
- **Authentication**: Google OAuth 2.0
- **Storage**: Ionic Storage + LocalStorage
- **Build Tool**: Angular CLI
- **Deployment**: GitHub Pages

## 📋 Prerequisites

Before running this application, ensure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- Ionic CLI (`npm install -g @ionic/cli`)
- Angular CLI (`npm install -g @angular/cli`)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jsramraj/PlayMate.git
   cd PlayMate/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   
   Create or update `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'your-api-url-here',
     googleSignInClientId: 'your-google-client-id-here'
   };
   ```

4. **Run the development server**
   ```bash
   ionic serve
   ```

The application will open in your browser at `http://localhost:8100`.

## 🏗️ Build for Production

To build the application for production:

```bash
ionic build --prod
```

The build artifacts will be stored in the `www/` directory.

## 📱 Progressive Web App (PWA)

This application is configured as a PWA with:
- App manifest for installation
- Service worker for offline functionality
- Responsive design for all screen sizes
- Native-like user experience

## 🔐 Authentication Setup

The app uses Google Sign-In for authentication. To set up:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google+ API
3. Create OAuth 2.0 credentials
4. Add your domain to authorized origins
5. Update the `googleSignInClientId` in environment files

## 🎨 Theming

The application uses a custom red-themed color scheme:
- **Primary Color**: `#dc2626` (Red)
- **Secondary Color**: `#1f2937` (Dark Gray)
- **Light Theme**: Optimized for readability and accessibility

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                 # Core services and guards
│   │   ├── guards/          # Route guards
│   │   ├── services/        # Application services
│   │   └── interceptors/    # HTTP interceptors
│   ├── features/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── members/        # Member management
│   │   ├── attendance/     # Attendance tracking
│   │   ├── payments/       # Payment management
│   │   └── settings/       # App settings
│   ├── shared/             # Shared components
│   └── tabs/               # Tab navigation
├── assets/                 # Static assets
├── environments/           # Environment configurations
└── theme/                 # Global styling
```

## 🚀 Deployment

The application is automatically deployed to GitHub Pages using GitHub Actions. The workflow:

1. Triggers on pushes to the `main` branch
2. Builds the Ionic application
3. Deploys to GitHub Pages

Live URL: [https://jsramraj.github.io/PlayMate/](https://jsramraj.github.io/PlayMate/)

## 📝 Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **PlayMate Team** - Initial work and development

## 🐛 Known Issues

- Ensure proper Google OAuth configuration for authentication
- Some features may require backend API integration

## 📞 Support

For support, please open an issue in the GitHub repository or contact the PlayMate team.

---

**Built with ❤️ for the fitness community**
