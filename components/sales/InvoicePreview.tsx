import { StyleSheet, Platform } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { Transaction, Settings } from '@/types/database';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface InvoicePreviewProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings?: Settings | null;
}

export default function InvoicePreview({
  visible,
  onClose,
  transaction,
  settings,
}: InvoicePreviewProps) {
  if (!transaction) return null;

  const generateHTML = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Factura</title>
          <style>
            @page {
              margin: 15mm;
              size: A4;
            }
            body {
              font-family: 'Helvetica', sans-serif;
              margin: 0;
              padding: 40px;
              color: #2d3436;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #dfe6e9;
              padding: 40px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #dfe6e9;
            }
            .logo {
              max-width: 200px;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #2d3436;
              margin-bottom: 10px;
            }
            .company-details {
              color: #636e72;
              font-size: 14px;
              line-height: 1.6;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #2d3436;
              margin-bottom: 20px;
              text-align: center;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-column {
              flex: 1;
            }
            .info-row {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #2d3436;
            }
            .info-value {
              color: #636e72;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th,
            .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #dfe6e9;
            }
            .items-table th {
              background-color: #f5f6fa;
              font-weight: bold;
              color: #2d3436;
            }
            .items-table .text-right {
              text-align: right;
            }
            .totals-section {
              margin-left: auto;
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #dfe6e9;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 18px;
              border-bottom: 2px solid #2d3436;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #dfe6e9;
              color: #636e72;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
              .container {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${settings?.logo ? `<img src="${settings.logo}" class="logo" alt="Logo"/>` : ''}
              <div class="company-name">${settings?.companyName || 'Empresa'}</div>
              <div class="company-details">
                <div>${settings?.address || ''}</div>
                <div>RNC: ${settings?.rnc || ''}</div>
                <div>Tel: ${settings?.phone || ''}</div>
                <div>${settings?.email || ''}</div>
              </div>
            </div>

            <div class="invoice-title">Factura</div>

            <div class="info-section">
              <div class="info-column">
                <div class="info-row">
                  <span class="info-label">Cliente:</span>
                  <div class="info-value">${transaction.client.name}</div>
                </div>
                ${transaction.client.rnc ? `
                <div class="info-row">
                  <span class="info-label">RNC:</span>
                  <div class="info-value">${transaction.client.rnc}</div>
                </div>
                ` : ''}
                ${transaction.client.address1 ? `
                <div class="info-row">
                  <span class="info-label">Dirección:</span>
                  <div class="info-value">${transaction.client.address1}</div>
                </div>
                ` : ''}
              </div>
              <div class="info-column">
                <div class="info-row">
                  <span class="info-label">Factura #:</span>
                  <div class="info-value">${transaction.document}</div>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha:</span>
                  <div class="info-value">${formatDate(transaction.date)}</div>
                </div>
                <div class="info-row">
                  <span class="info-label">Vendedor:</span>
                  <div class="info-value">${transaction.vendor.name} ${transaction.vendor.lastname || ''}</div>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${transaction.items?.map(item => `
                  <tr>
                    <td>
                      <div style="font-weight: bold;">${item.product.name}</div>
                      <div style="font-size: 12px; color: #636e72;">${item.product.code}</div>
                    </td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">$${item.price.toFixed(2)}</td>
                    <td class="text-right">$${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${transaction.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div class="total-row">
                <span>ITBIS (${settings?.taxIncluded ? 'Incluida' : 'Aplicada'}):</span>
                <span>$${transaction.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div class="total-row final">
                <span>Total:</span>
                <span>$${transaction.value.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Gracias por su compra</p>
              <p>${settings?.companyName || 'Empresa'} - RNC: ${settings?.rnc || ''}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateHTML();
      
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
          });
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>Imprimir Factura</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">¿Desea imprimir la factura?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>Cancelar</Button>
          <Button mode="contained" onPress={handlePrint}>
            Imprimir
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}