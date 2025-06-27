import { StyleSheet, Platform } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { Transaction, PaymentReference, Settings } from '@/types/database';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ReceiptPrintProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction;
  payment: PaymentReference;
  settings?: Settings | null;
}

export default function ReceiptPrint({
  visible,
  onClose,
  transaction,
  payment,
  settings,
}: ReceiptPrintProps) {
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
          <title>Recibo de Pago</title>
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
              position: relative;
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
            .receipt-title {
              font-size: 24px;
              font-weight: bold;
              color: #2d3436;
              margin-bottom: 20px;
              text-align: center;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
            }
            .info-label {
              font-weight: bold;
              color: #2d3436;
            }
            .info-value {
              color: #636e72;
            }
            .amount-section {
              background-color: #f5f6fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #dfe6e9;
            }
            .amount-row:last-child {
              border-bottom: none;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #2d3436;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #dfe6e9;
              color: #636e72;
              font-size: 14px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(0,0,0,0.03);
              pointer-events: none;
              z-index: -1;
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

            <div class="receipt-title">Recibo de Pago</div>

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Número de Recibo:</span>
                <span class="info-value">${payment.controlRc}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${formatDate(payment.createdAt)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${transaction.client.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${transaction.vendor.name} ${transaction.vendor.lastname || ''}</span>
              </div>
            </div>

            <div class="amount-section">
              <div class="info-row">
                <span class="info-label">Factura:</span>
                <span class="info-value">${transaction.document}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Monto Total de Factura:</span>
                <span class="info-value">$${transaction.value.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Monto Pagado:</span>
                <span class="total-amount">$${payment.paymentAmount.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Saldo Pendiente:</span>
                <span class="info-value">$${transaction.pendingValue.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Gracias por su pago</p>
              <p>${settings?.companyName || 'Empresa'} - RNC: ${settings?.rnc || ''}</p>
            </div>

            <div class="watermark">PAGADO</div>
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
      console.error('Error printing receipt:', error);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>Imprimir Recibo</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">¿Desea imprimir el recibo de pago?</Text>
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