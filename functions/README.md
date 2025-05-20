# Firebase Functions for Email Notifications

This directory contains Firebase Cloud Functions for the PMS system, primarily focused on sending email notifications to suppliers.

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `functions` directory with your email credentials:

```
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

Note: For Gmail, using an App Password is recommended instead of your regular password. You can create one at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### 3. Deploy Functions

```bash
# From the project root
npm run deploy:functions
```

Or directly using the Firebase CLI:

```bash
firebase deploy --only functions
```

## Email Functionality

The system includes two main email-related functions:

1. **`sendEmail`** - An HTTPS callable function that can be invoked from the client-side application to send emails with optional attachments.

2. **`purchaseOrderStatusChanged`** - A Firestore trigger that automatically sends emails when a purchase order status changes (e.g., when it's approved or received).

## Testing

You can test the email functionality using the Firebase Emulator Suite:

```bash
firebase emulators:start
```

This will start the emulators, including the Functions emulator, allowing you to test the email functions locally.

## Troubleshooting

- If emails are not sending, check the Firebase Functions logs for any errors:
  ```bash
  firebase functions:log
  ```

- For Gmail users, ensure that "Less secure app access" is enabled or use OAuth2 for better security.

- If you're getting SMTP authentication errors, make sure your email and password are correct in the environment variables. 