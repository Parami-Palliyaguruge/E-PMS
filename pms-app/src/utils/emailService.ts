import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';
import { PurchaseOrder, PurchaseOrderItem } from '../types';

// Use an interface that matches the structure we're actually using in PurchaseOrders.tsx
interface POWithSupplierAndItems {
  id: string;
  poNumber: string;
  supplier: { id: string; name: string };
  status: string;
  items: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productName?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  notes?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryAddress: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachmentData?: any; // Optional attachment data for PDFs
}

/**
 * Send an email using Firebase Cloud Functions
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body (can be HTML or plain text)
 * @param attachmentData Optional attachment data
 * @returns Promise resolving to the result of the function call
 */
export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  attachmentData?: any
): Promise<any> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email format:', to);
      throw new Error('Invalid email address format');
    }

    // Validate required fields
    if (!to || !subject || !body) {
      console.error('Missing required email fields:', { 
        hasTo: Boolean(to), 
        hasSubject: Boolean(subject), 
        hasBody: Boolean(body) 
      });
      throw new Error('Missing required email fields');
    }

    console.log('Preparing to send email:', {
      to,
      subject,
      bodyPreview: body.substring(0, 100) + '...',
      hasAttachment: Boolean(attachmentData)
    });

    // First check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('DEV MODE - Email would be sent:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      if (attachmentData) {
        console.log('Attachment data:', attachmentData);
      }
      return { success: true, message: 'Email logged (development mode)' };
    }

    // Call the Firebase Cloud Function
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    const emailData: EmailData = {
      to,
      subject,
      body,
      attachmentData
    };
    
    console.log('Calling Firebase function with data:', emailData);
    const result = await sendEmailFunction(emailData);
    console.log('Email function result:', result);
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Generate a PDF representation of a purchase order for email attachment
 * 
 * @param po The purchase order data
 * @returns Simple representation of PO data for attachment
 */
export const generatePOAttachment = (po: POWithSupplierAndItems): any => {
  // In a real implementation, this would create a proper PDF
  // For this example, we'll return a simplified object representation
  return {
    poNumber: po.poNumber,
    supplierName: po.supplier.name,
    date: new Date().toISOString(),
    items: po.items.map(item => ({
      name: item.name || item.productName || 'Product',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    })),
    subtotal: po.subtotal,
    tax: po.tax,
    shipping: po.shipping,
    total: po.total,
    currency: po.currency
  };
}; 