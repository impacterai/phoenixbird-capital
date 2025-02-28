const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const auth = require('../middleware/auth');

// Configure SendGrid if API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const sendgridConfigured = !!SENDGRID_API_KEY;

if (sendgridConfigured) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('SendGrid configured successfully');
} else {
    console.warn('SendGrid API key not found. Email functionality will be simulated.');
}

/**
 * @route POST /api/email/send-confirmation
 * @desc Send investment confirmation email
 * @access Private (requires authentication)
 */
router.post('/send-confirmation', auth, async (req, res) => {
    try {
        const { email, investmentDetails } = req.body;
        
        if (!email || !investmentDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Format currency with commas
        const formattedAmount = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(investmentDetails.amount);
        
        // Format date
        const formattedDate = new Date(investmentDetails.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create email content
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@phoenixbirdcapital.com',
            subject: 'Investment Confirmation - PhoenixBird Capital',
            text: `Thank you for your interest in investing in ${investmentDetails.name}. Your investment amount of ${formattedAmount} has been confirmed, and we will follow up shortly with the legal documents.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://phoenixbirdcapital.com/images/logo.png" alt="PhoenixBird Capital" style="max-width: 200px;">
                    </div>
                    <h2 style="color: #333; margin-bottom: 20px;">Investment Confirmation</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for your interest in investing with PhoenixBird Capital.</p>
                    <div style="background-color: #f8f9fa; border-left: 4px solid #00a86b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-style: italic; color: #555;">
                            Your investment amount of <strong>${formattedAmount}</strong> in <strong>${investmentDetails.name}</strong> has been confirmed, and we will follow up shortly with the legal documents.
                        </p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; width: 40%;"><strong>Investment ID:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${investmentDetails.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Investment Name:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${investmentDetails.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${investmentDetails.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Wire Transfer'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${formattedDate}</td>
                        </tr>
                    </table>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">
                        Our team will be in touch shortly with further instructions and the necessary legal documents to complete your investment.
                    </p>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">
                        If you have any questions, please don't hesitate to contact us at <a href="mailto:support@phoenixbirdcapital.com" style="color: #00a86b;">support@phoenixbirdcapital.com</a>.
                    </p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
                        <p>&copy; ${new Date().getFullYear()} PhoenixBird Capital. All rights reserved.</p>
                        <p>This email was sent to you because you expressed interest in investing with PhoenixBird Capital.</p>
                    </div>
                </div>
            `
        };
        
        // Only send email if SendGrid is configured, otherwise simulate it
        if (sendgridConfigured) {
            await sgMail.send(msg);
            console.log(`Confirmation email sent to ${email} for investment in ${investmentDetails.name}`);
        } else {
            // Simulate email sending in development
            console.log('SIMULATED EMAIL:');
            console.log(`To: ${email}`);
            console.log(`Subject: ${msg.subject}`);
            console.log('Text content:', msg.text);
            console.log('*Email simulation complete - API Key not configured*');
        }
        
        return res.status(200).json({ 
            success: true, 
            message: sendgridConfigured ? 'Confirmation email sent successfully' : 'Email sending simulated successfully',
            simulated: !sendgridConfigured
        });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ 
            error: 'Failed to send confirmation email',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
