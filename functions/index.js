const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Configure the email transport using the default SMTP transport and a GMail account
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'paraminidarsha93@gmail.com',
    pass: 'yhai qhcm fufr gmrg',
  },
  debug: true, // Enable debug output
  logger: true // Log information about the transport
});

// Test the email configuration on startup
mailTransport.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Test email function
exports.testEmail = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Testing email functionality...');
    
    const mailOptions = {
      from: 'PMS System <paraminidarsha93@gmail.com>',
      to: 'paraminidarsha93@gmail.com', // Send to yourself for testing
      subject: 'Test Email from PMS System',
      text: 'This is a test email to verify the email functionality is working.',
      html: 'This is a test email to verify the email functionality is working.'
    };
    
    console.log('Sending test email with options:', JSON.stringify(mailOptions, null, 2));
    const info = await mailTransport.sendMail(mailOptions);
    console.log('Test email sent successfully. Response:', info);
    
    res.status(200).send('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).send(`Error sending test email: ${error.message}`);
  }
});

/**
 * Cloud Function to send emails
 * 
 * Expects a request with the following structure:
 * {
 *   to: "recipient@example.com",
 *   subject: "Email subject",
 *   body: "Email body (can be HTML)",
 *   attachmentData: {optional attachment data}
 * }
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    // Validate email data
    if (!data.to || !data.subject || !data.body) {
      console.error('Missing required email fields:', { 
        hasTo: Boolean(data.to), 
        hasSubject: Boolean(data.subject), 
        hasBody: Boolean(data.body) 
      });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires "to", "subject", and "body" fields.'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      console.error('Invalid email format:', data.to);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email address format.'
      );
    }
    
    console.log('Attempting to send email to:', data.to);
    console.log('Email data:', {
      to: data.to,
      subject: data.subject,
      bodyLength: data.body.length,
      hasAttachment: Boolean(data.attachmentData)
    });
    
    // Set up email options
    const mailOptions = {
      from: 'PMS System <paraminidarsha93@gmail.com>',
      to: data.to,
      subject: data.subject,
      text: data.body, // Plain text version
      html: data.body.replace(/\n/g, '<br>'), // HTML version with line breaks
    };
    
    // Add attachment if attachmentData is provided
    if (data.attachmentData) {
      console.log('Adding attachment to email');
      mailOptions.attachments = [{
        filename: `PO-${data.attachmentData.poNumber}.pdf`,
        content: Buffer.from(JSON.stringify(data.attachmentData, null, 2)),
        contentType: 'application/pdf'
      }];
    }
    
    // Send the email
    console.log('Sending email with options:', JSON.stringify(mailOptions, null, 2));
    await mailTransport.sendMail(mailOptions);
    
    console.log('Email sent successfully to:', data.to);
    // Return success
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', `Failed to send email: ${error.message}`);
  }
});

// Function that gets triggered when a PO status changes
exports.purchaseOrderStatusChanged = functions.firestore
  .document('businesses/{businessId}/purchaseOrders/{poId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Only proceed if status changed
      if (beforeData.status === afterData.status) {
        return null;
      }
      
      console.log('PO status changed from', beforeData.status, 'to', afterData.status);
      
      // Get supplier email from the suppliers collection
      const supplierDoc = await admin.firestore()
        .collection('businesses')
        .doc(context.params.businessId)
        .collection('suppliers')
        .doc(afterData.supplier.id)
        .get();
      
      if (!supplierDoc.exists) {
        console.warn('Supplier not found for PO:', afterData.poNumber);
        return { error: 'Supplier not found' };
      }
      
      const supplierData = supplierDoc.data();
      const supplierEmail = supplierData.email;
      
      if (!supplierEmail) {
        console.warn('No supplier email found for PO:', afterData.poNumber);
        return { error: 'No supplier email found' };
      }
      
      // Handle different status changes
      let subject = '';
      let body = '';
      
      if (afterData.status === 'approved') {
        subject = `Purchase Order ${afterData.poNumber} has been approved`;
        body = `Dear ${afterData.supplier.name},\n\nYour purchase order ${afterData.poNumber} has been approved.`;
      } else if (afterData.status === 'received') {
        subject = `Purchase Order ${afterData.poNumber} has been received`;
        body = `Dear ${afterData.supplier.name},\n\nYour purchase order ${afterData.poNumber} has been received.`;
      } else if (afterData.status === 'sent') {
        subject = `New Purchase Order ${afterData.poNumber}`;
        body = `Dear ${afterData.supplier.name},\n\nA new purchase order ${afterData.poNumber} has been created for you.`;
      } else {
        // Status we don't need to send an email for
        return null;
      }
      
      // Add more details to the email
      body += `\n\nOrder details:\n`;
      body += `PO Number: ${afterData.poNumber}\n`;
      body += `Order Date: ${new Date(afterData.orderDate).toLocaleDateString()}\n`;
      body += `Expected Delivery: ${new Date(afterData.expectedDeliveryDate).toLocaleDateString()}\n`;
      body += `Delivery Address: ${afterData.deliveryAddress}\n\n`;
      
      // Add items
      body += `Items:\n`;
      afterData.items.forEach((item, index) => {
        body += `${index + 1}. ${item.name} - Quantity: ${item.quantity}, Unit Price: ${afterData.currency} ${item.unitPrice.toFixed(2)}\n`;
      });
      
      body += `\nSubtotal: ${afterData.currency} ${afterData.subtotal.toFixed(2)}\n`;
      body += `Tax: ${afterData.currency} ${afterData.tax.toFixed(2)}\n`;
      body += `Shipping: ${afterData.currency} ${afterData.shipping.toFixed(2)}\n`;
      body += `Total: ${afterData.currency} ${afterData.total.toFixed(2)}\n\n`;
      
      if (afterData.notes) {
        body += `Notes: ${afterData.notes}\n\n`;
      }
      
      body += `Regards,\n${context.auth?.token?.name || 'The Procurement Team'}`;
      
      console.log('Preparing to send email to supplier:', supplierEmail);
      
      // Send the email
      const mailOptions = {
        from: 'PMS System <paraminidarsha93@gmail.com>',
        to: supplierEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      };
      
      await mailTransport.sendMail(mailOptions);
      console.log('Email sent successfully to supplier:', supplierEmail);
      return { success: true };
    } catch (error) {
      console.error('Error in purchaseOrderStatusChanged:', error);
      return { error: error.message };
    }
  }); 