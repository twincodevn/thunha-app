// Note: We need to use ts-node to run this or use require with transpiled files
// For simplicity, I will use a minimal ts file and run with npx ts-node
import { generateInvoicePDF } from './src/lib/pdf';
import * as fs from 'fs';

const data = {
    invoiceNumber: "INV-202602-TEST",
    date: "13/02/2026",
    dueDate: "20/02/2026",
    landlord: {
        name: "Test Landlord",
        address: "123 Test St",
    },
    tenant: {
        name: "Test Tenant",
        phone: "0123456789",
    },
    property: {
        name: "Test Property",
        address: "123 Test St",
        roomNumber: "101",
    },
    billing: {
        month: 2,
        year: 2026,
        baseRent: 5000000,
        electricityUsage: 100,
        electricityAmount: 350000,
        waterUsage: 10,
        waterAmount: 150000,
        discount: 0,
        total: 5500000,
    }
};

try {
    const pdfBuffer = generateInvoicePDF(data);
    fs.writeFileSync('test_invoice.pdf', Buffer.from(pdfBuffer));
    console.log('PDF generated successfully: test_invoice.pdf');
    console.log('File size:', fs.statSync('test_invoice.pdf').size, 'bytes');
} catch (error) {
    console.error('Error generating PDF:', error);
}
