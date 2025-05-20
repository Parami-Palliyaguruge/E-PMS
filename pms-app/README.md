# ProcureFlow - Procurement Management System

A complete procurement management system for small and medium businesses built with React, TypeScript, and Firebase.

## Features

- **User Authentication**: Secure signup, login, and account management
- **Multi-Tenant Architecture**: Each business has isolated data and users
- **Supplier Management**: CRUD operations for suppliers with detailed information
- **Purchase Order Management**: Create, track, and manage purchase orders
- **Inventory Management**: Track stock levels with low stock alerts
- **Invoice Management**: Enter, approve, and track invoices
- **Budget Tracking**: Set and monitor budgets for departments or projects
- **Reporting**: Generate procurement activity reports
- **User Management**: Invite users and assign roles with specific permissions

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Material-UI (MUI) for a modern, responsive interface
- **Backend**: Firebase
  - Authentication for user management
  - Firestore for data storage
  - Cloud Storage for file uploads
  - Hosting for deployment
- **Routing**: React Router for navigation

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── app/          # Components for the main application
│   └── marketing/    # Components for the marketing website
├── contexts/         # React contexts for state management
├── firebase/         # Firebase configuration and services
├── pages/            # Page components
│   ├── app/          # Main application pages
│   └── marketing/    # Marketing website pages
├── services/         # Business logic and API calls
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/procureflow.git
   cd procureflow
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password), Firestore, and Storage
   - Update `src/firebase/firebaseConfig.ts` with your Firebase project credentials

4. Start the development server:
   ```
   npm start
   ```

### Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## Security

The application uses Firebase's security rules to ensure that:
- Users can only access their business's data
- Role-based access control is enforced for operations
- Data is protected at the database level

Check `firestore.rules` for the detailed security configuration.

## Future Enhancements

- AI-powered demand prediction
- Supplier optimization suggestions
- Enhanced reporting with data visualization
- Mobile applications for on-the-go procurement management

## License

This project is licensed under the MIT License - see the LICENSE file for details.
