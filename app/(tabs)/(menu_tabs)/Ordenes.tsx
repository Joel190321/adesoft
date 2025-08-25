import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiUrl } from '@/config';
import { useThemeColor } from '@/hooks/useThemeColor';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Stack, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
LogBox.ignoreAllLogs(true);

interface Orden {
  IdOrden: number;
  Fecha: string;
  IdCliente: string;
  IdVendedor: string;
  Subtotal: number;
  Impuesto: number;
  ValorImp: number;
  Total: number;
  Estado: string;
  FechaCreacion?: string;
  Cliente?: {
    IdCliente: string;
    NombreC: string;
  };
  Vendedor?: {
    IdVendedor: string;
    NombreV: string;
  };
  items?: OrdenItem[];
}

interface OrdenItem {
  IdOrden: number;
  IdProducto: number;
  Cantidad: number;
  PrecioV: number;
  Impuesto: number;
  producto?: {
    IdProducto: number;
    NombreP: string;
    CodigoP: string;
  };
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isGeneratingFactura, setIsGeneratingFactura] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [vendor, setVendor] = useState<{ IdVendedor?: string; NombreV?: string } | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('A'); // Default to 'A' (Activa)
  const [selectedPaperSize, setSelectedPaperSize] = useState<'letter' | 'thermal'>('thermal');

  const themeBg1 = useThemeColor({}, 'background');
  const themeBg2 = useThemeColor({}, 'backgroundSecondary');
  const themeBg3 = useThemeColor({}, 'backgroundTertiary');
  const themeText = useThemeColor({}, 'text');
  const themeTextSecondary = useThemeColor({}, 'textSecondary');
  const themeAccent = useThemeColor({}, 'tint');

  // Load vendor from AsyncStorage
  const loadVendor = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('currentVendor');
      if (vendorData && vendorData !== 'undefined') {
        const vendedor = JSON.parse(vendorData);
        setVendor(vendedor);
        return vendedor;
      } else {
        setVendor(null);
        return null;
      }
    } catch (err) {
      console.log('Error loading vendor:', err);
      return null;
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Adesoft - Ordenes';
    }
    const initializeData = async () => {
      const currentVendor = await loadVendor();
      fetchOrdenes(currentVendor?.IdVendedor, filterEstado);
    };
    initializeData();
  }, []);

  // Refetch orders when filter changes
  useEffect(() => {
    if (vendor) {
      fetchOrdenes(vendor.IdVendedor, filterEstado);
    }
  }, [filterEstado]);

  const fetchOrdenes = async (idVendedor?: string, estado?: string) => {
    setLoading(true);
    try {
      let url = `${apiUrl}ordenes`;
      const params = [];
      if (idVendedor) params.push(`IdVendedor=${encodeURIComponent(idVendedor)}`);
      if (estado) params.push(`Estado=${encodeURIComponent(estado)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data);
      } else {
        console.error('Error fetching orders:', response.status);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdenDetails = async (ordenId: number) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${apiUrl}ordenes/${ordenId}`);
      if (response.ok) {
        const ordenWithDetails = await response.json();
        setSelectedOrden(ordenWithDetails);
      } else {
        console.error('Error fetching order details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (orden: Orden) => {
    setSelectedOrden(orden);
    setShowDetailsModal(true);
    await fetchOrdenDetails(orden.IdOrden);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Verificar si la fecha es vÃ¡lida
    if (isNaN(date.getTime())) {
      return dateString; // Retornar el string original si no es una fecha vÃ¡lida
    }
    
    // Formatear fecha y hora en formato 12 horas
    const formattedDate = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const formattedTime = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedDate} ${formattedTime}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  // Wrapper function for refresh button
  const handleRefresh = () => {
    if (vendor) {
      fetchOrdenes(vendor.IdVendedor, filterEstado);
    }
  };

  // Handle status filter change
  const handleFilterChange = (estado: string) => {
    setFilterEstado(estado);
  };

  // Handle order editing - navigate to Dashboard with order id
  const handleEditOrder = (orden: Orden | null) => {
    if (!orden) return;
    router.push({
      pathname: '/(tabs)/(menu_tabs)/Dashboard',
      params: { orderId: orden.IdOrden },
    });
  };
  // Función para generar e imprimir/descargar factura
  const handlePrintFactura = async (
    ordenId: number, 
    action: 'open' | 'download' | 'print',
    paperSize: string = 'letter' // Default to 'letter' if not provided
  ) => {    try {
      setIsGeneratingFactura(true);
      
      // Generar PDF de factura con el tamaño de papel especificado
      const response = await fetch(`${apiUrl}facturas/pdf/${ordenId}?paperSize=${encodeURIComponent(paperSize)}`);
      
      if (!response.ok) {
        throw new Error(`Error generando factura: ${response.status}`);
      }

      // Handle mobile platforms
      if (Platform.OS !== 'web') {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        return new Promise((resolve) => {
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const pdfData = base64data.split(',')[1];
            const fileName = `FACT-${String(ordenId).padStart(8, '0')}.pdf`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            
            try {
              // Save the file locally
              await FileSystem.writeAsStringAsync(fileUri, pdfData, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              if (action === 'open') {
                // Open the PDF in the device's default viewer
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Factura ${ordenId}`,
                  UTI: 'com.adobe.pdf',
                });
              } else if (action === 'print') {
                // Print the PDF
                try {
                  await Print.printAsync({
                    uri: fileUri,
                    orientation: 'portrait',
                    useMarkupFormatter: true,
                    margins: {
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                    },
                  });
                } catch (error: unknown) {
                  // If printing fails, try to open the PDF for sharing
                  console.warn('Print failed, falling back to share:', error);
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Factura ${ordenId}`,
                    UTI: 'com.adobe.pdf',
                  });
                }
              } else {
                // Download the PDF
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Descargar factura ${ordenId}`,
                  UTI: 'com.adobe.pdf',
                });
              }
              
              // Clean up the file after a delay
              setTimeout(async () => {
                try {
                  await FileSystem.deleteAsync(fileUri, { idempotent: true });
                } catch (e) {
                  console.warn('Error deleting temp file:', e);
                }
              }, 60000); // Delete after 1 minute
              
            } catch (error) {
              console.error('Error handling PDF:', error);
            } finally {
              setIsGeneratingFactura(false);
              setShowPrintOptions(false);
              resolve(null);
            }
          };
        });
      }
      
      // Web platform handling
      const rawBlob = await response.blob();
      const blob = new Blob([rawBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (action === 'open' || action === 'print') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          const removeIframeAndRevoke = () => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          };
          
          const printWindow = iframe.contentWindow;
          if (printWindow) {
            try {
              printWindow.document.title = `FACT-${String(ordenId).padStart(8, '0')}.pdf`;
            } catch (e) {}
            
            if (action === 'print') {
              printWindow.focus();
              printWindow.print();
            }
            
            printWindow.addEventListener('afterprint', removeIframeAndRevoke);
            setTimeout(removeIframeAndRevoke, 30000);
          } else {
            setTimeout(removeIframeAndRevoke, 3000);
          }
        };
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `FACT-${String(ordenId).padStart(8, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error('Error generando cotización:', error);
      alert('Error al generar la cotización. Por favor, intente nuevamente.');
    } finally {
      setIsGeneratingFactura(false);
      setShowPrintOptions(false);
    }
  };


  return (
    <>
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Ordenes', headerShown: false }} />
        
        <ThemedView style={styles.header}>
          <ThemedText style={[styles.title, { color: themeText }]}>Ordenes</ThemedText>
          <Pressable style={styles.refreshButton} onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color={themeAccent} />
          </Pressable>
        </ThemedView>

        {/* Filter buttons */}
        <ThemedView style={[styles.filterContainer, { backgroundColor: themeBg2 }]}>
          <ThemedText style={[styles.filterLabel, { color: themeTextSecondary }]}>Filtrar por estado:</ThemedText>
          <ThemedView style={[styles.filterButtons, { backgroundColor: themeBg2 }]}>
            <Pressable 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: filterEstado === 'A' ? themeAccent : themeBg3,
                  borderColor: filterEstado === 'A' ? themeAccent : themeTextSecondary
                }
              ]}
              onPress={() => handleFilterChange('A')}
            >
              <ThemedText style={[
                styles.filterButtonText, 
                { color: filterEstado === 'A' ? '#fff' : themeText }
              ]}>
                Activas
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: filterEstado === 'P' ? themeAccent : themeBg3,
                  borderColor: filterEstado === 'P' ? themeAccent : themeTextSecondary
                }
              ]}
              onPress={() => handleFilterChange('P')}
            >
              <ThemedText style={[
                styles.filterButtonText, 
                { color: filterEstado === 'P' ? '#fff' : themeText }
              ]}>
                Procesadas
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: filterEstado === 'N' ? themeAccent : themeBg3,
                  borderColor: filterEstado === 'N' ? themeAccent : themeTextSecondary
                }
              ]}
              onPress={() => handleFilterChange('N')}
            >
              <ThemedText style={[
                styles.filterButtonText, 
                { color: filterEstado === 'N' ? '#fff' : themeText }
              ]}>
                Nulas
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: filterEstado === '' ? themeAccent : themeBg3,
                  borderColor: filterEstado === '' ? themeAccent : themeTextSecondary
                }
              ]}
              onPress={() => handleFilterChange('')}
            >
              <ThemedText style={[
                styles.filterButtonText, 
                { color: filterEstado === '' ? '#fff' : themeText }
              ]}>
                Todas
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeAccent} />
            <ThemedText style={[styles.loadingText, { color: themeTextSecondary }]}>
              Cargando órdenes...
            </ThemedText>
          </ThemedView>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
            {ordenes.length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <Feather name="inbox" size={48} color={themeTextSecondary} />
                <ThemedText style={[styles.emptyText, { color: themeTextSecondary }]}>
                  No hay órdenes disponibles
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.ordenesGrid}>
                {ordenes.map((orden, index) => (
                <ThemedView key={orden.IdOrden || index} style={[styles.ordenCard, { backgroundColor: themeBg2 }]}>
                  <ThemedView style={[styles.ordenHeader,  { backgroundColor: themeBg2 }]}>
                    <ThemedView style={[styles.ordenInfo,  { backgroundColor: themeBg2 }]}>
                      <ThemedText style={[styles.ordenId, { color: themeAccent, backgroundColor: themeBg2   }]}>
                        #{orden.IdOrden}
                      </ThemedText>
                      <ThemedText style={[styles.ordenDate, { color: themeTextSecondary, backgroundColor: themeBg2  }]}>
                        {formatDate(orden.FechaCreacion || orden.Fecha)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={[styles.ordenStatus, { backgroundColor: themeBg2 }]}>
                      <ThemedText style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: orden.Estado === 'A' ? '#A6A6A6' : 
                                         orden.Estado === 'P' ? '#61B863' : '#D14338',
                          color: '#fff'
                        }
                      ]}>
                        {orden.Estado === 'A' ? 'Activa' : orden.Estado === 'P' ? 'Procesada' : 'Nula'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={[styles.ordenDetails, { backgroundColor: themeBg2, padding: 12 }]}>
                    <ThemedView style={[styles.detailRow, { backgroundColor: themeBg2 }]}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary, backgroundColor: themeBg2 }]}>Cliente:</ThemedText>
                      <ThemedText 
                        style={[styles.detailValue, { 
                          color: themeText, 
                          backgroundColor: themeBg2,
                          maxWidth: '70%' 
                        }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {orden.Cliente?.NombreC 
                          ? (orden.Cliente.NombreC.length > 50 
                              ? `${orden.Cliente.NombreC.substring(0, 47)}...` 
                              : orden.Cliente.NombreC)
                          : orden.IdCliente}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={[styles.detailRow, { backgroundColor: themeBg2 }]}>
                    
                    </ThemedView>
                    <ThemedView style={[styles.detailRow, { backgroundColor: themeBg2 }]}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary, backgroundColor: themeBg2 }]}>Total:</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: themeAccent, fontWeight: 'bold', backgroundColor: themeBg2 }]}>
                        {formatCurrency(orden.Total)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={[styles.buttonContainer, { backgroundColor: themeBg2 }]}>
                    <Pressable 
                      style={[styles.viewButton, { backgroundColor: themeAccent }]}
                      onPress={() => handleViewDetails(orden)}
                    >
                      <Feather name="eye" size={16} color={themeText} />
                      <ThemedText style={[styles.viewButtonText, { color: themeText }]}>
                        Ver Detalles
                      </ThemedText>
                    </Pressable>

                  </ThemedView>
                </ThemedView>
                ))}
              </ThemedView>
            )}
          </ScrollView>
        )}
      </ThemedView>

      {/* Modal de detalles de la orden - FIXED FOR MOBILE */}
      {selectedOrden && (
        <Modal
          visible={showDetailsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
              backgroundColor: themeBg2, 
              ...(Platform.OS === 'web' ? { maxWidth: '50%' } : {}) 
            }]}>              {/* Fixed Header */}
              <View style={[styles.modalHeader, { backgroundColor: themeBg2 }]}>
                <ThemedText style={[styles.modalTitle, { color: themeText }]}>
                  Detalles de la Orden #{selectedOrden?.IdOrden}
                </ThemedText>
                <Pressable onPress={() => setShowDetailsModal(false)}>
                  <Feather name="x" size={24} color={themeText} />
                </Pressable>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollViewContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.modalSection, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={[styles.sectionTitle, { color: themeAccent }]}>
                    Información General
                  </ThemedText>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Fecha de Creación:</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: themeText }]}>
                        {formatDate(selectedOrden.FechaCreacion || selectedOrden.Fecha)}
                      </ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Cliente:</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: themeText }]}>
                        {selectedOrden.Cliente?.NombreC || selectedOrden.IdCliente}
                      </ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Vendedor:</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: themeText }]}>
                        {selectedOrden.Vendedor?.NombreV || selectedOrden.IdVendedor}
                      </ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Estado:</ThemedText>
                      <ThemedText style={[
                        styles.infoValue, 
                        { 
                          color: '#fff',
                          backgroundColor: selectedOrden.Estado === 'A' ? '#A6A6A6' : 
                                         selectedOrden.Estado === 'P' ? '#61B863' : '#D14338',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 'bold',
                          alignSelf: 'flex-start'
                        }
                      ]}>
                        {selectedOrden.Estado === 'A' ? 'Activa' : selectedOrden.Estado === 'P' ? 'Procesada' : 'Nula'}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={[styles.modalSection, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={[styles.sectionTitle, { color: themeAccent }]}>
                    Items de la Orden
                  </ThemedText>
                  
                  {loadingDetails ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={themeAccent} />
                      <ThemedText style={[styles.loadingText, { color: themeTextSecondary }]}>
                        Cargando items...
                      </ThemedText>
                    </View>
                  ) : selectedOrden.items && selectedOrden.items.length > 0 ? (
                    selectedOrden.items.map((item: any, index: number) => {
                      return (
                        <View key={index} style={[styles.itemCard, { backgroundColor: themeBg3 }]}>
                          <View style={styles.itemHeader}>
                            <ThemedText style={[styles.itemName, { color: themeText }]}>
                              {item.producto?.NombreP || `Producto ${item.IdProducto}`}
                            </ThemedText>
                            <ThemedText style={[styles.itemCode, { color: themeTextSecondary }]}>
                              #{item.producto?.CodigoP || item.IdProducto}
                            </ThemedText>
                          </View>
                          <View style={styles.itemDetails}>
                            <View style={styles.itemDetail}>
                              <ThemedText style={[styles.itemLabel, { color: themeTextSecondary }]}>Cantidad:</ThemedText>
                              <ThemedText style={[styles.itemValue, { color: themeText }]}>
                                {item.Cantidad}
                              </ThemedText>
                            </View>
                            <View style={styles.itemDetail}>
                              <ThemedText style={[styles.itemLabel, { color: themeTextSecondary }]}>Precio:</ThemedText>
                              <ThemedText style={[styles.itemValue, { color: themeText }]}>
                                {formatCurrency(item.PrecioV)}
                              </ThemedText>
                            </View>
                            <View style={styles.itemDetail}>
                              <ThemedText style={[styles.itemLabel, { color: themeTextSecondary }]}>Subtotal:</ThemedText>
                              <ThemedText style={[styles.itemValue, { color: themeAccent, fontWeight: 'bold' }]}>
                                {formatCurrency(item.Cantidad * item.PrecioV)}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={[styles.emptyText, { color: themeTextSecondary }]}>
                        No hay items disponibles
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={[styles.modalSection, styles.totalSection]}>
                  <View style={styles.totalContainer}>
                    <View style={styles.totalRow}>
                      <ThemedText style={[styles.totalLabel, { color: themeTextSecondary }]}>Subtotal:</ThemedText>
                      <ThemedText style={[styles.totalValue, { color: themeText }]}>
                        {formatCurrency(selectedOrden.Subtotal)}
                      </ThemedText>
                    </View>
                    <View style={styles.totalRow}>
                      <ThemedText style={[styles.totalLabel, { color: themeTextSecondary }]}>ITBIS:</ThemedText>
                      <ThemedText style={[styles.totalValue, { color: themeText }]}>
                        {formatCurrency(selectedOrden.ValorImp)}
                      </ThemedText>
                    </View>
                    <View style={[styles.totalRow, styles.finalTotal]}>
                      <ThemedText style={[styles.totalLabel, { color: themeText, fontWeight: 'bold' }]}>Total:</ThemedText>
                      <ThemedText style={[styles.totalValue, { color: themeAccent, fontWeight: 'bold' }]}>
                        {formatCurrency(selectedOrden.Total)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Add some bottom padding to ensure content is not hidden behind buttons */}
                <View style={{ height: 100 }} />
              </ScrollView>
              
              {/* Fixed Bottom Buttons */}
              <View style={[styles.modalButtonContainer, { backgroundColor: themeBg2 }]}>
                <Pressable
                  style={[styles.modalEditButton, { backgroundColor: '#FF9500' }]}
                  onPress={() => {handleEditOrder(selectedOrden), setShowDetailsModal(false)}}
                >
                  <Feather name="edit" size={18} color={themeText} />
                  <ThemedText style={[styles.modalPrintButtonText, { color: themeText }]}>
                    Editar
                  </ThemedText>
                </Pressable>

                <View style={styles.printButtonContainer}>
                  <Pressable
                    style={[
                      styles.modalPrintButton,
                      {
                        backgroundColor: isGeneratingFactura ? '#ccc' : '#4CAF50',
                        opacity: isGeneratingFactura ? 0.7 : 1,
                        maxWidth: 300,
                        alignSelf: 'flex-end',
                      },
                    ]}
                    onPress={() => setShowPrintOptions(!showPrintOptions)}
                    disabled={isGeneratingFactura}
                  >
                    {isGeneratingFactura ? (
                      <ActivityIndicator size="small" color={themeText} />
                    ) : (
                      <Feather name="printer" size={18} color={themeText} />
                    )}
                    <ThemedText style={[styles.modalPrintButtonText, { color: themeText }]}>
                      {isGeneratingFactura ? 'Generando...' : 'Cotización'}
                    </ThemedText>
                    <Feather name={showPrintOptions ? 'chevron-up' : 'chevron-down'} size={18} color={themeText} style={{ marginLeft: 'auto' }} />
                  </Pressable>

                  {showPrintOptions && (
                       <View style={[styles.printOptionsContainer, { backgroundColor: themeBg2 }]}>
                       <View style={styles.paperSizeContainer}>
                         <ThemedText style={[styles.paperSizeLabel, { color: themeText }]}>Tamaño de papel:</ThemedText>
                         <View style={styles.paperSizeButtons}>
                           <Pressable 
                             style={[
                               styles.paperSizeButton, 
                               selectedPaperSize === 'thermal' && { backgroundColor: themeAccent }
                             ]} 
                             onPress={() => setSelectedPaperSize('thermal')}
                           >
                             <ThemedText style={[
                               styles.paperSizeText, 
                               selectedPaperSize === 'thermal' && { color: themeBg1 }
                             ]}>
                               Térmico
                             </ThemedText>
                           </Pressable>
                           <Pressable 
                             style={[
                               styles.paperSizeButton, 
                               selectedPaperSize === 'letter' && { backgroundColor: themeAccent }
                             ]} 
                             onPress={() => setSelectedPaperSize('letter')}
                           >
                             <ThemedText style={[
                               styles.paperSizeText, 
                               selectedPaperSize === 'letter' && { color: themeBg1 }
                             ]}>
                               Carta
                             </ThemedText>
                           </Pressable>
                         </View>
                       </View>
                       
                       <View style={styles.actionButtons}>
                         <Pressable 
                           style={[styles.actionButton, { backgroundColor: themeBg3 }]} 
                           onPress={() => handlePrintFactura(selectedOrden.IdOrden, 'download', selectedPaperSize)}
                         >
                           <Feather name="download" size={16} color={themeText} />
                           <ThemedText style={[styles.actionButtonText, { color: themeText }]}>
                             Descargar
                           </ThemedText>
                         </Pressable>
                         <Pressable 
                           style={[styles.actionButton, { backgroundColor: themeBg3 }]} 
                           onPress={() => handlePrintFactura(selectedOrden.IdOrden, 'print', selectedPaperSize)}
                         >
                           <Feather name="printer" size={16} color={themeText} />
                           <ThemedText style={[styles.actionButtonText, { color: themeText }]}>
                             Imprimir
                           </ThemedText>
                         </Pressable>
                       </View>
                     </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  paperSizeContainer: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
  },
  paperSizeLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  paperSizeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  paperSizeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#666',
  },
  paperSizeText: {
    fontSize: 14,
  },
  actionButtons: {
    ...(Platform.OS === 'web' && { flexDirection: 'row' }),
    ...(Platform.OS !== 'web' && { flexDirection: 'column' }),    
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
    ...(Platform.OS !== 'web' && { marginBottom: 10 }),    

  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  ordenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  ordenCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 300,
    maxWidth: 400,
    flex: 1,
    justifyContent: 'space-between',
  },
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ordenInfo: {
    flex: 1,
  },
  ordenId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ordenDate: {
    fontSize: 14,
    marginTop: 2,
  },
  ordenStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordenDetails: {
    marginBottom: 16,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  viewButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  printButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  // FIXED MODAL STYLES FOR MOBILE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    width: '90%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 16,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollViewContent: {
    padding: 16,
    paddingBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  itemCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  itemCode: {
    fontSize: 12,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 12,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  totalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  // FIXED BUTTON CONTAINER FOR MOBILE
  modalButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
  },
  printButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  modalPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  modalPrintButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  printOptionsContainer: {
    position: 'absolute',
    bottom: '100%',
    ...(Platform.OS === 'web' && { maxWidth: 300 }),
    ...(Platform.OS !== 'web' && { maxWidth: 350 }),
    right: 0,
    ...(Platform.OS === 'web' && { left: 325 }),
    ...(Platform.OS !== 'web' && { left: 0 }),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 8,
  },
  printOptionButton: {
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  printOptionText: {
    fontSize: 14,
  },
});