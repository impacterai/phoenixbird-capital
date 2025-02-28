# Setting Up SendGrid Email for PhoenixBird Capital

This guide will walk you through setting up SendGrid to send investment confirmation emails.

## Prerequisites

1. A SendGrid account - [Sign up here](https://signup.sendgrid.com/)
2. Node.js and npm installed on your system

## Setup Steps

### 1. Get a SendGrid API Key

1. Log in to your SendGrid account
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Name your key (e.g., "PhoenixBird Investment Emails")
5. Set the permissions to "Restricted Access" and select "Mail Send" permissions
6. Click "Create & View"
7. Copy your API key (you'll only see it once!)

### 2. Configure Your Environment Variables

Add the following variables to your `.env` file:

```
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_verified_sender_email@example.com
```

**Note:** If no SendGrid API key is provided, the application will run in "development mode," where emails are simulated and logged to the console rather than actually sent. This is useful for testing without sending real emails.

### 3. Verify a Sender Email

To send emails through SendGrid, you need to verify the email address you'll use as the "FROM" address:

1. In SendGrid, go to Settings > Sender Authentication
2. Choose "Single Sender Verification"
3. Fill in the sender details (this should match your SENDGRID_FROM_EMAIL)
4. Follow the verification steps (SendGrid will send a verification email)

### 4. Testing Your Setup

To test if your email configuration is working correctly:

1. Make sure your server is running with the updated code
2. Log in to the platform
3. Navigate to the investments page
4. Select an investment and complete the form
5. Click "Confirm Investment"

#### Production Mode (With API Key)
If your SendGrid API key is configured, a real email will be sent to the user's registered email address.

#### Development Mode (No API Key)
If you haven't set up your SendGrid API key, the system will:
- Show a slightly different success message indicating emails would be sent in production
- Log the email details to the console for debugging
- Return a success response with `simulated: true` in the API response

## Troubleshooting

If emails are not being sent:

1. Check the server logs for errors
2. Verify that your SendGrid API key is correct
3. Make sure your sender email is verified in SendGrid
4. Check that the user has a valid email in the database
5. Confirm that the .env file is properly configured and accessible to the application

## Security Considerations

- Never commit your SendGrid API key to version control
- Use environment variables for all sensitive information
- Consider using SendGrid's IP Access Management to restrict API access

## Email Template

The investment confirmation email includes:

- Investment ID
- Investment Name
- Amount
- Payment Method
- Date
- Follow-up instructions

You can modify the email template in `routes/email.js` if needed.
