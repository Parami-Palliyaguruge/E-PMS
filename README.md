# PMS System - Firebase Functions Setup

This document provides instructions for setting up and deploying Firebase Functions for the PMS (Procurement Management System) application.

## Prerequisites

- Node.js 16 or later
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase account with a project set up

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root project dependencies
npm install

# Install function-specific dependencies
npm run setup:functions
```

### 2. Configure Environment Variables

```bash
# Copy the environment example file
cd functions
cp .env.example .env

# Edit the .env file with your email credentials
```

For Gmail users:
- Create an App Password at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Use this App Password instead of your regular Gmail password

### 3. Local Testing

Test your functions locally before deployment:

```bash
npm run emulators
```

This will start the Firebase emulators suite, allowing you to test functions, firestore, and other Firebase services locally.

### 4. Deployment

You can deploy the functions in several ways:

#### Option 1: Interactive Deployment Tool

```bash
npm run deploy
```

This will start an interactive tool allowing you to choose what to deploy (functions only, hosting only, or everything).

#### Option 2: Direct Deployment Commands

```bash
# Deploy only functions
npm run deploy:functions

# Deploy only hosting
npm run deploy:hosting

# Deploy everything (manually)
firebase deploy
```

## Functions Overview

The system includes these Firebase Functions:

1. **sendEmail**: HTTPS callable function for sending emails with optional attachments
2. **purchaseOrderStatusChanged**: Firestore trigger that sends emails when PO status changes

## Troubleshooting

- Check the Firebase Functions logs:
  ```bash
  firebase functions:log
  ```

- If emails are not sending, verify:
  - SMTP credentials are correct
  - For Gmail: "Less secure app access" is enabled or you're using an App Password
  - Network connectivity from Firebase Functions to your SMTP server

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Nodemailer Documentation](https://nodemailer.com/) (used for email sending) 