/* eslint-disable @typescript-eslint/no-unused-vars */
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Platform, View, Image, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiUrl } from '@/config';
import { ThemedInput } from '@/components/ThemedInput';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
export default function Dashboard() {
  const [vendor, setVendor] = useState<{ IdVendedor?: string; NombreV?: string, IdRuta?: string } | null>(null);
  const [modalClientesVisible, setModalClientesVisible] = useState(false);
  const themeBg = useThemeColor({}, 'background');
  const themeBg2 = useThemeColor({}, 'backgroundSecondary');
  const themeText = useThemeColor({}, 'text');
  const themeTextSecondary = useThemeColor({}, 'textSecondary');
  const themeAccent = useThemeColor({}, 'tint');
  const [clientes, setClientes] = useState<any[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [rutasMap, setRutasMap] = useState<{ [key: string]: string }>({});
  const [rutas, setRutas] = useState<any[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  const [zonas, setZonas] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const [zonasMap, setZonasMap] = useState<{ [key: string]: string }>({});
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const isWide = windowWidth > 850;
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  // Estado para modal de productos
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
  const [searchProducto, setSearchProducto] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState<{ producto: any, cantidad: number }[]>([]);
  const [productoCantidadInput, setProductoCantidadInput] = useState<{ id: number | string, cantidad: string } | null>(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isGeneratingFactura, setIsGeneratingFactura] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [configData, setConfigData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  // Estado para modal de advertencia de orden en proceso
  const [showOrderInProgressModal, setShowOrderInProgressModal] = useState(false);
  // Estado para edición de órdenes
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<any>(null);
  const [loadingEditingOrder, setLoadingEditingOrder] = useState(false);
  const [showOrderInfoModal, setShowOrderInfoModal] = useState(false);
  const params = useLocalSearchParams();
  const [showRutaPicker, setShowRutaPicker] = useState(false);
  const [showZonaPicker, setShowZonaPicker] = useState(false);

  // Función para verificar si hay una orden en proceso
  const hasOrderInProgress = () => {
    return selectedClient !== null || productosSeleccionados.length > 0;
  };

  // Función para limpiar la orden en proceso
  const clearOrderInProgress = async () => {
    setSelectedClient(null);
    setProductosSeleccionados([]);
    setProductoCantidadInput(null);
    try {
      await AsyncStorage.removeItem('orderInProgress');
      await AsyncStorage.removeItem('selectedClient');
      await AsyncStorage.removeItem('selectedProducts');
    } catch (error) {
      console.error('Error clearing order:', error);
    }
  };

  // Función para procesar la orden
  const handleProcessOrder = async () => {
    if (!selectedClient || productosSeleccionados.length === 0) {
      return;
    }

    try {
      // Calcular totales
      const totalProductos = productosSeleccionados.reduce((acc, p) => acc + (p.producto.PrecioP || 0) * p.cantidad, 0);
      const tipoImpuesto = configData?.TipoImpuesto || 'A';
      const porcentajeImpuesto = parseFloat(configData?.Impuesto || '18') / 100;
      
      let subtotal = 0, itbis = 0, total = 0;
      
      if (totalProductos > 0) {
        if (tipoImpuesto === 'I') {
          subtotal = totalProductos / (1 + porcentajeImpuesto);
          itbis = totalProductos - subtotal;
          total = totalProductos;
        } else {
          subtotal = totalProductos;
          itbis = subtotal * porcentajeImpuesto;
          total = subtotal + itbis;
        }
      }

      // Preparar datos de la orden
      const ordenData = {
        IdCliente: selectedClient.IdCliente,
        IdVendedor: vendor?.IdVendedor || '',
        Subtotal: subtotal || 0,
        Impuesto: parseInt(configData?.Impuesto || '18'), // Guardar como entero
        ValorImp: itbis || 0,
        Total: total || 0,
        Estado: 'A' as const, // Estado activo
      };

      // Preparar items de la orden
      const items = productosSeleccionados.map(p => ({
        IdProducto: p.producto.IdProducto,
        Cantidad: p.cantidad,
        PrecioV: p.producto.PrecioP || 0,
        Impuesto: (p.producto.PrecioP || 0) * porcentajeImpuesto,
      }));

      // Enviar a la API - crear nueva orden o actualizar existente
      let response, result, ordenId;
      
      if (isEditingOrder && editingOrderData) {
        // Actualizar orden existente con sus items
        console.log('Enviando datos para actualizar orden:', { ordenData, items }); // Log para depurar
        response = await fetch(`${apiUrl}ordenes/${editingOrderData.IdOrden}/with-items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ordenData, items }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        result = await response.json();
        ordenId = result.IdOrden;
        console.log('Orden actualizada exitosamente:', result);
        
        // Reset editing state
        setIsEditingOrder(false);
        setEditingOrderData(null);
      } else {
        // Crear nueva orden
        response = await fetch(`${apiUrl}ordenes/with-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ordenData,
            items,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        result = await response.json();
        ordenId = result.orden?.IdOrden;
        console.log('Orden creada exitosamente:', result);
      }

      // Guardar el ID de la orden para generar la factura
      
      // Limpiar la orden después de procesarla
      await clearOrderInProgress();

      // Mostrar modal de confirmación con opción de imprimir factura
      setShowFacturaModal(true);
      
      // Guardar el ID de la orden para usar en la generación de factura
      if (ordenId) {
        await AsyncStorage.setItem('lastCreatedOrderId', ordenId.toString());
      }

    } catch (error) {
      console.error('Error procesando la orden:', error);
      // Aquí podrías mostrar un modal de error
      alert('Error al procesar la orden. Por favor, intente nuevamente.');
    }
  };

  // Función para generar e imprimir/descargar factura
  const handlePrintFactura = async (ordenId: number, action: 'open' | 'download' | 'print') => {
    try {
      setIsGeneratingFactura(true);
      
      // Generar PDF de factura
      const response = await fetch(`${apiUrl}facturas/pdf/${ordenId}`);
      
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
                });
              } else if (action === 'print') {
                // Print the PDF
                try {
                  await Print.printAsync({
                    uri: fileUri,
                  });
                } catch (error: unknown) {
                  // Ignore cancellation errors
                  if (error instanceof Error && error.message !== 'Printing cancelled') {
                    throw error; // Re-throw if it's not a cancellation
                  }
                  // Silently handle cancellation
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
              alert('Error al procesar el archivo PDF. Por favor, intente nuevamente.');
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

  // Función para cargar datos de configuración
  const loadConfigData = async () => {
    setLoadingConfig(true);
    try {
      // Primero intentar cargar desde AsyncStorage
      const storedConfig = await AsyncStorage.getItem('configData');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfigData(parsedConfig);
        setLoadingConfig(false);
        return;
      }

      // Si no existe en AsyncStorage, cargar desde el API
      const response = await fetch(`${apiUrl}configs`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const configData = data[0];
          setConfigData(configData);
          // Guardar en AsyncStorage para uso futuro
          await AsyncStorage.setItem('configData', JSON.stringify(configData));
        } else {
          console.error('Error loading config:', response.status);
        }
      } else {
        console.error('Error loading config:', response.status);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Función para guardar el estado de la orden
  const saveOrderState = async () => {
    try {
      if (hasOrderInProgress()) {
        await AsyncStorage.setItem('orderInProgress', 'true');
        if (selectedClient) {
          await AsyncStorage.setItem('selectedClient', JSON.stringify(selectedClient));
        }
        if (productosSeleccionados.length > 0) {
          await AsyncStorage.setItem('selectedProducts', JSON.stringify(productosSeleccionados));
        }
      } else {
        await AsyncStorage.removeItem('orderInProgress');
        await AsyncStorage.removeItem('selectedClient');
        await AsyncStorage.removeItem('selectedProducts');
      }
    } catch (error) {
      console.error('Error saving order state:', error);
    }
  };

  // Guardar estado cuando cambie la orden
  useEffect(() => {
    saveOrderState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, productosSeleccionados]);

  // Event listener para beforeunload (recarga de página)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasOrderInProgress()) {
        // Mostrar mensaje personalizado en el alert nativo
        const message = 'Tiene una orden en proceso. ¿Está seguro de que desea salir?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    // Event listener para keydown (Ctrl+R, F5, etc.)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (hasOrderInProgress()) {
        // Ctrl+R, F5, Ctrl+F5
        if ((event.ctrlKey && event.key === 'r') || 
            event.key === 'F5' || 
            (event.ctrlKey && event.key === 'F5')) {
          event.preventDefault();
          setShowOrderInProgressModal(true);
        }
      }
    };

    // Solo agregar event listeners en web
    if (Platform.OS === 'web') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, productosSeleccionados]);

  // Obtener productos desde el API
  const fetchProductos = async (query?: string) => {
    setLoadingProductos(true);
    try {
      let url = `${apiUrl}productos`;
      if (query && query.trim() !== '') {
        url += `/search?q=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      setProductos(Array.isArray(result) ? result : []);
      setProductosFiltrados(Array.isArray(result) ? result : []);
    } catch (e) {
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  // Efecto para inicializar la lista de productos filtrados cuando se abre el modal
  useEffect(() => {
    if (modalProductosVisible) {
      setProductosFiltrados(productos);
    }
  }, [modalProductosVisible, productos]);

  // Función para manejar la búsqueda manual de productos
  const handleProductSearch = () => {
    if (searchProducto.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(
        p =>
          p.NombreP?.toLowerCase().includes(searchProducto.toLowerCase()) ||
          p.CodigoP?.toLowerCase().includes(searchProducto.toLowerCase()) ||
          p.PresentacionP?.toLowerCase().includes(searchProducto.toLowerCase()) ||
          p.GrupoP?.toLowerCase().includes(searchProducto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  };

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (modalProductosVisible) {
      fetchProductos(); // Cargar todos los productos al abrir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalProductosVisible]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Función para cargar el vendedor
  const loadVendor = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('currentVendor');
      if (vendorData && vendorData !== 'undefined') {
        const vendedor = JSON.parse(vendorData);
        setVendor(vendedor);
      } else {
        setVendor(null);
      }
    } catch (err) {
      console.log('Error cargando vendedor:', err);
    }
  };

  // Cargar todos los clientes o buscar con filtros
  const fetchClientes = async (query?: string, idruta?: string, idzona?: string) => {
    setLoadingClientes(true);
    try {
      let url = `${apiUrl}clientes`;
      const params = [];
      if (query && query.trim() !== '') params.push(`q=${encodeURIComponent(query)}`);
      if (idruta && idruta !== '') params.push(`Idruta=${encodeURIComponent(idruta)}`);
      if (idzona && idzona !== '') params.push(`Idzona=${encodeURIComponent(idzona)}`);
      if (params.length > 0) url += '/search?' + params.join('&');
      
      const res = await fetch(url);
      const result = await res.json();
      setClientes(Array.isArray(result) ? result : []);
      setClientesFiltrados(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error('Error fetching clients:', e);
      setClientes([]);
      setClientesFiltrados([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Función para manejar la búsqueda manual de clientes
  const handleClientSearch = () => {
    fetchClientes(searchCliente, rutaSeleccionada, zonaSeleccionada);
  };

  // Función para obtener el nombre de la ruta por Id
  const fetchRutaNombre = async (idruta: string) => {
    if (!idruta) return '';
    if (rutasMap[idruta]) return rutasMap[idruta];
    try {
      const res = await fetch(`${apiUrl}rutas/searchIdRuta?q=${encodeURIComponent(idruta)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setRutasMap(prev => ({ ...prev, [idruta]: data[0].Ruta }));
        return data[0].Ruta;
      }
    } catch (e) {
      console.error('Error fetching route name:', e);
    }
    return '';
  };

  // Función para obtener el nombre de la zona por Id
  const fetchZonaNombre = async (idzona: string) => {
    if (!idzona) return '';
    if (zonasMap[idzona]) return zonasMap[idzona];
    try {
      const res = await fetch(`${apiUrl}zonas/searchIdZona?q=${encodeURIComponent(idzona)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setZonasMap(prev => ({ ...prev, [idzona]: data[0].Zona }));
        return data[0].Zona;
      }
    } catch (e) {
      console.error('Error fetching zone name:', e);
    }
    return '';
  };

  // Efecto para inicializar la lista de productos filtrados cuando se abre el modal
  useEffect(() => {
    if (modalProductosVisible) {
      setProductosFiltrados(productos);
    }
  }, [modalProductosVisible, productos]);

  // Efecto para cargar clientes al abrir el modal y al cambiar filtros
  useEffect(() => {
    if (modalClientesVisible) {
      const rutaPorDefecto = vendor?.IdRuta || '';
      setRutaSeleccionada(rutaPorDefecto);
      fetchClientes('', rutaPorDefecto, zonaSeleccionada);
    } else {
      // Limpia la búsqueda y los filtros cuando el modal se cierra
      setSearchCliente('');
      setRutaSeleccionada('');
      setZonaSeleccionada('');
    }
  }, [modalClientesVisible, vendor]);


  
  // Refetch clients when filters change while modal is open
  useEffect(() => {
    if (modalClientesVisible) {
      fetchClientes(searchCliente, rutaSeleccionada, zonaSeleccionada);
    }
  }, [rutaSeleccionada, zonaSeleccionada]);

  // Cargar nombres de rutas y zonas al montar el componente
  useEffect(() => {
    // Cargar rutas
    fetch(`${apiUrl}rutas`)
      .then(res => res.json())
      .then(data => setRutas(data))
      .catch(() => setRutas([]));
    
    // Cargar zonas
    fetch(`${apiUrl}zonas`)
      .then(res => res.json())
      .then(data => setZonas(data))
      .catch(() => setZonas([]));
  }, []);

  // Cargar nombres de rutas y zonas para los clientes mostrados
  useEffect(() => {
    const cargarNombresRutas = async () => {
      const idRutasUnicas = Array.from(new Set(clientes.map(c => c.Idruta).filter(Boolean)));
      for (const idruta of idRutasUnicas) {
        await fetchRutaNombre(idruta);
      }
    };
    
    const cargarNombresZonas = async () => {
      const idZonasUnicas = Array.from(new Set(clientes.map(c => c.Idzona).filter(Boolean)));
      for (const idzona of idZonasUnicas) {
        await fetchZonaNombre(idzona);
      }
    };
    
    if (clientes.length > 0) {
      cargarNombresRutas();
      cargarNombresZonas();
    }
  }, [clientes]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Adesoft - Dashboard';
    }
    loadVendor();
    loadConfigData();
    checkForEditingOrder();
  }, []);

  useEffect(() => {
    if (params.orderId) {
      const orderId = parseInt(params.orderId as string, 10);
      // Evitar recargar si ya se está editando la misma orden
      if (!isNaN(orderId) && editingOrderData?.IdOrden !== orderId) {
        handleEditOrder(orderId);
      }
    }
  }, [params.orderId]);

  // Check if there's an order to edit when Dashboard loads
  const checkForEditingOrder = async () => {
    try {
      const editingOrderData = await AsyncStorage.getItem('editingOrder');
      if (editingOrderData) {
        const orderData = JSON.parse(editingOrderData);
        await handleEditOrder(orderData.IdOrden);
        // Clear the editing order data after loading
        await AsyncStorage.removeItem('editingOrder');
      }
    } catch (error) {
      console.error('Error checking for editing order:', error);
    }
  };

  // Preload zonas and rutas when Dashboard loads
  useEffect(() => {
    fetch(`${apiUrl}zonas`)
      .then(res => res.json())
      .then(data => setZonas(data))
      .catch(() => setZonas([]));
    fetch(`${apiUrl}rutas`)
      .then(res => res.json())
      .then(data => setRutas(data))
      .catch(() => setRutas([]));
  }, []);

  // Efecto para cargar clientes al abrir el modal y al cambiar filtros
  useEffect(() => {
    if (modalClientesVisible) {
      const rutaPorDefecto = vendor?.IdRuta || '';
      setRutaSeleccionada(rutaPorDefecto);
      fetchClientes(searchCliente, rutaPorDefecto, zonaSeleccionada); // Carga inicial
    } else {
      // Limpia la búsqueda y los filtros cuando el modal se cierra
      setSearchCliente('');
      setRutaSeleccionada('');
      setZonaSeleccionada('');
    }
  }, [modalClientesVisible, vendor]);

  // Refetch clients when filters change while modal is open
  useEffect(() => {
    if (modalClientesVisible) {
      fetchClientes(searchCliente, rutaSeleccionada, zonaSeleccionada);
    }
  }, [rutaSeleccionada, zonaSeleccionada]);


  // useEffect para cargar los nombres de las rutas de los clientes
  useEffect(() => {
    const cargarNombresRutas = async () => {
      const idRutasUnicas = Array.from(new Set(clientes.map(c => c.Idruta).filter(Boolean)));
      for (const idruta of idRutasUnicas) {
        await fetchRutaNombre(idruta);
      }
    };
    if (clientes.length > 0) {
      cargarNombresRutas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes]);

  // useEffect para cargar los nombres de las zonas de los clientes
  useEffect(() => {
    const cargarNombresZonas = async () => {
      const idZonasUnicas = Array.from(new Set(clientes.map(c => c.Idzona).filter(Boolean)));
      for (const idzona of idZonasUnicas) {
        await fetchZonaNombre(idzona);
      }
    };
    if (clientes.length > 0) {
      cargarNombresZonas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes]);

  // Funciones para limpiar búsqueda y pickers al cerrar modales
  const handleCloseClienteModal = () => {
    setModalClientesVisible(false);
    setSearchCliente('');
    setRutaSeleccionada('');
    setZonaSeleccionada('');
  };
  
  const handleCloseProductoModal = () => {
    setModalProductosVisible(false);
    setSearchProducto('');
    setProductoCantidadInput(null); // Clear any pending product quantity input
  };

  // Función para iniciar la edición de una orden
  const handleEditOrder = async (ordenId: number) => {
    setLoadingEditingOrder(true);
    try {
      // Fetch order details
      const response = await fetch(`${apiUrl}ordenes/${ordenId}`);
      if (response.ok) {
        const orderData = await response.json();
        setEditingOrderData(orderData);
        setIsEditingOrder(true);
        
        // Pre-fill the form with existing order data
        if (orderData.Cliente) {
          setSelectedClient(orderData.Cliente);
        }
        
        // Pre-fill products
        if (orderData.items && orderData.items.length > 0) {
          const productosConCantidad = orderData.items.map((item: any) => ({
            producto: item.producto || {
              IdProducto: item.IdProducto,
              NombreP: item.producto?.NombreP || 'Producto',
              PrecioP: item.PrecioV
            },
            cantidad: item.Cantidad
          }));
          setProductosSeleccionados(productosConCantidad);
        }
      } else {
        console.error('Error loading order for edit:', response.status);
        alert('Error al cargar la orden para editar');
      }
    } catch (error) {
      console.error('Error loading order for edit:', error);
      alert('Error al cargar la orden para editar');
    } finally {
      setLoadingEditingOrder(false);
    }
  };

  // Función para cancelar la edición
  const handleCancelEdit = async () => {
    setIsEditingOrder(false);
    setEditingOrderData(null);
    await clearOrderInProgress();
    router.replace('/Dashboard');
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: themeBg }}>
      {/* Overlay de cargando para edición de orden */}
      {loadingEditingOrder && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color={themeAccent} />
          <ThemedText style={{ marginTop: 18, color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 8 }}>
            Cargando orden para editar...
          </ThemedText>
        </View>
      )}
      <ThemedView style={styles.container}>
                <ScrollView id="dashboard-scrollbar" style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

        {isEditingOrder && editingOrderData && (
          <View style={[styles.editingInfoContainer, { backgroundColor: themeBg2, borderColor: themeAccent }]}>
            <ThemedText style={styles.editingInfoText}>
              Editando Orden <ThemedText style={{fontWeight: 'bold'}}>#{editingOrderData.IdOrden}</ThemedText>
              <ThemedText style={{fontSize: 12, color: themeTextSecondary}}> - {new Date(editingOrderData.FechaCreacion || editingOrderData.Fecha).toLocaleDateString('es-ES')}</ThemedText>
            </ThemedText>
            <Pressable style={styles.cancelEditButton} onPress={handleCancelEdit}>
              <Feather name="x" size={16} color={themeText} />
              <ThemedText style={styles.cancelEditButtonText}>Cancelar</ThemedText>
            </Pressable>
          </View>
        )}

{vendor ? (
          <ThemedView style={[styles.rowContainer, { flexDirection: isWide ? 'row' : 'column' }]}>
            <ThemedView style={[styles.infoBox, { backgroundColor: themeBg2, width: isWide ? '38%' : '100%' }]}> 
              <ThemedText type="title" style={[styles.infoTitle, { color: themeAccent }]}>Información del Vendedor</ThemedText>
              <ThemedView style={[styles.infoRow, { backgroundColor: themeBg2 }]}> 
                <ThemedView style={[styles.iconCol, { backgroundColor: themeBg2, paddingRight: 20 }]}> 
                  <Feather name="user" size={48} style={[{ color: themeAccent, backgroundColor: themeBg2}]} />
                </ThemedView>
                <ThemedView style={[styles.infoCol, { backgroundColor: themeBg2 }]}> 
                  <ThemedText style={[styles.value, { color: themeAccent }]}>{vendor.IdVendedor || '-'}</ThemedText>
                  <ThemedText style={[styles.value, { color: themeText }]}>{vendor.NombreV || '-'}</ThemedText>
                  {vendor?.IdRuta ? (
                    <ThemedText style={{ color: themeTextSecondary, fontStyle: 'italic', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
                      RUTA: {rutasMap[vendor.IdRuta] || vendor.IdRuta}
                    </ThemedText>
                  ) : (
                    <ThemedText style={{ color: themeTextSecondary, fontStyle: 'italic', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
                      RUTA: N/A
                    </ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedView>
            
            {/* Logo de la empresa - siempre visible en pantallas grandes */}
            {isWide && (
              <ThemedView style={[styles.logoContainer, { backgroundColor: '#fff' }]}>
                {configData?.Logo && (
                  <Image 
                    source={{ uri: configData.Logo }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                )}
              </ThemedView>
            )}
                        
            {/* Contenedor de información del cliente y selección */}
            <ThemedView style={[styles.selectBox, { backgroundColor: themeBg2, width: isWide ? '38%' : '100%', marginTop: isWide ? 0 : 16 }]}> 
              <ThemedText type="title" style={[styles.infoTitle, { color: themeAccent, marginBottom: 10 }]}>Información del Cliente</ThemedText>
              {selectedClient ? (
                <ThemedView style={[styles.infoRow, { backgroundColor: themeBg2, maxWidth: '100%', overflow: 'hidden' }]}>
                  <ThemedView style={[styles.iconCol, { backgroundColor: themeBg2, paddingRight: 12 }]}>
                    <Feather name="user" size={40} style={{ color: themeAccent, backgroundColor: themeBg2 }} />
                  </ThemedView>
                  <ThemedView style={[styles.infoCol, { backgroundColor: themeBg2, flex: 1, minWidth: 0 }]}>
                    <ThemedText 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                      style={[styles.value, { color: themeAccent }]}
                    >
                      {selectedClient.IdCliente || '-'}
                    </ThemedText>
                    <ThemedText 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                      style={[styles.value, { color: themeText }]}
                    >
                      {selectedClient.NombreC || '-'}
                    </ThemedText>
                    <ThemedText 
                      numberOfLines={1} 
                      ellipsizeMode="tail"
                      style={[styles.value, { color: themeTextSecondary }]}
                    >
                      RNC: {selectedClient.Rnc || '-'}
                    </ThemedText>
                  </ThemedView>
                  <Pressable onPress={() => setSelectedClient(null)} style={{ marginLeft: 16, alignSelf: 'flex-start', padding: 4 }}>
                    <Feather name="x-circle" size={28} color={themeAccent} />
                  </Pressable>
                </ThemedView>
              ) : null}
              <Pressable style={[styles.selectButton, { backgroundColor: themeAccent, marginTop: selectedClient ? 16 : 0 }]} onPress={() => setModalClientesVisible(true)}>
                <Feather name="user" size={22} color={themeText} style={{ marginRight: 8 }} />
                <ThemedText style={[styles.selectButtonText, { color: themeText }]}>Seleccionar Cliente</ThemedText>
              </Pressable>
            </ThemedView>
            {/* Modal para seleccionar cliente */}
            <Modal
            visible={modalClientesVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalClientesVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalClientesVisible(false)}>
              <Pressable
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: themeBg2,
                    width: '90%',
                    minWidth: 220,
                    padding: 16,
                  },
                ]}
                {...(Platform.OS === 'web' ? { className: 'modal-maxwidth-95vw modal-width-90vw' } : {})}
                onPress={e => e.stopPropagation()}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <ThemedText style={{ color: themeText, fontSize: 18 }}>Seleccionar Cliente</ThemedText>
                  <Pressable onPress={handleCloseClienteModal}>
                    <Feather name="x" size={24} color={themeText} />
                  </Pressable>
                </View>
                 {/* Mensaje de ruta o de no ruta, igual a Dashboard */}
                {vendor?.IdRuta ? (
                  <ThemedText style={{ color: themeAccent, fontStyle: 'italic', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
                    Mostrando clientes de la ruta: {rutasMap[vendor.IdRuta] || vendor.IdRuta}
                  </ThemedText>
                ) : (
                  <ThemedText style={{ color: themeTextSecondary, fontStyle: 'italic', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
                    El vendedor no tiene una ruta asignada. Se mostrarán todos los clientes.
                  </ThemedText>
                )}  
                <View style={[styles.searchInputContainer, { 
                  borderColor: themeAccent, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%',
                  height: 50,
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  marginBottom: 12
                }]}>
                  <ThemedInput
                    placeholder="Buscar cliente..."
                    value={searchCliente}
                    onChangeText={setSearchCliente}
                    editable={!loadingClientes}
                    style={[styles.searchInput, {
                      flex: 1,
                      height: '100%',
                      borderWidth: 0,
                      padding: 0,
                      margin: 0,
                      transform: Platform.OS != 'web' ? [{ translateY: 6 }] : [],
                   }]}
                    onSubmitEditing={handleClientSearch}
                  />
                  <Pressable 
                    onPress={handleClientSearch} 
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                      padding: 4
                    })}
                  >
                    <Feather name="search" size={20} color={themeAccent} />
                  </Pressable>
                </View>
                
                
                <View style={[styles.filterContainer, { flexDirection: isWide ? 'row' : 'column', gap: isWide ? 8 : 12 }]}>
                  {/* Ruta Picker */}
                  <View style={{ width: '100%', flex: isWide ? 1 : 0, marginBottom: isWide ? 0 : 8  }}>
                    <Pressable 
                      onPress={() => setShowRutaPicker(true)}
                      style={[styles.pickerButton, { borderColor: themeAccent, backgroundColor: themeBg2 }]}
                    >
                      <ThemedText style={styles.pickerButtonText}>
                        {rutaSeleccionada ? rutas.find(r => r.Idruta === rutaSeleccionada)?.Ruta || rutaSeleccionada : 'Todas las rutas'}
                      </ThemedText>
                    </Pressable>
                    
                    <Modal
                      visible={showRutaPicker}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setShowRutaPicker(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                          <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Seleccionar Ruta</ThemedText>
                            <Pressable onPress={() => setShowRutaPicker(false)}>
                              <ThemedText style={styles.modalClose}>Listo</ThemedText>
                            </Pressable>
                          </View>
                          <ScrollView>
                            <Pressable 
                              style={[styles.modalItem, !rutaSeleccionada && styles.selectedItem]}
                              onPress={() => {
                                setRutaSeleccionada('');
                                setShowRutaPicker(false);
                              }}
                            >
                              <ThemedText>Todas las rutas</ThemedText>
                            </Pressable>
                            {rutas.map((ruta: any) => (
                              <Pressable 
                                key={ruta.Idruta} 
                                style={[styles.modalItem, rutaSeleccionada === ruta.Idruta && styles.selectedItem]}
                                onPress={() => {
                                  setRutaSeleccionada(ruta.Idruta);
                                  setShowRutaPicker(false);
                                }}
                              >
                                <ThemedText>{ruta.Ruta || ruta.Idruta}</ThemedText>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                  </View>

                  {/* Zona Picker */}
                  <View style={{ width: '100%', flex: isWide ? 1 : 0, marginBottom: isWide ? 0 : 8 }}>
                    <Pressable 
                      onPress={() => setShowZonaPicker(true)}
                      style={[styles.pickerButton, { borderColor: themeAccent }]}
                    >
                      <ThemedText style={styles.pickerButtonText}>
                        {zonaSeleccionada ? zonas.find(z => z.Idzona === zonaSeleccionada)?.Zona || zonaSeleccionada : 'Todas las zonas'}
                      </ThemedText>
                    </Pressable>
                    
                    <Modal
                      visible={showZonaPicker}
                      transparent={true}
                      animationType="slide"
                      onRequestClose={() => setShowZonaPicker(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                          <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, {marginRight: 6}]}>Seleccionar Zona</ThemedText>
                            <Pressable onPress={() => setShowZonaPicker(false)}>
                              <ThemedText style={styles.modalClose}>Listo</ThemedText>
                            </Pressable>
                          </View>
                          <ScrollView>
                            <Pressable 
                              style={[styles.modalItem, !zonaSeleccionada && styles.selectedItem]}
                              onPress={() => {
                                setZonaSeleccionada('');
                                setShowZonaPicker(false);
                              }}
                            >
                              <ThemedText>Todas las zonas</ThemedText>
                            </Pressable>
                            {zonas.map((zona: any) => (
                              <Pressable 
                                key={zona.Idzona} 
                                style={[styles.modalItem, zonaSeleccionada === zona.Idzona && styles.selectedItem]}
                                onPress={() => {
                                  setZonaSeleccionada(zona.Idzona);
                                  setShowZonaPicker(false);
                                }}
                              >
                                <ThemedText>{zona.Zona || zona.Idzona}</ThemedText>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                  </View>
                </View>
                {loadingClientes ? (
                  <ActivityIndicator color={themeAccent} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView
                    style={styles.clientList}
                    {...(Platform.OS === 'web' ? { className: 'custom-scrollbar' } : {})}
                    contentContainerStyle={{ paddingBottom: 12 }}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={themeAccent === '#fff' ? 'white' : 'black'}
                  >
                    {clientesFiltrados.length === 0 ? (
                      <ThemedText style={{ color: themeText, textAlign: 'center', marginTop: 16 }}>No hay clientes.</ThemedText>
                    ) : (
                      clientes.slice(0, 20).map((cliente, idx) => (
                        <Pressable
                        key={cliente.IdCliente || cliente.id || idx}
                        style={[styles.clientItem, selectedClient && selectedClient.IdCliente === cliente.IdCliente ? { borderColor: themeAccent, borderWidth: 2 } : {}]}
                        onPress={() => {
                        setSelectedClient(cliente);
                        setModalClientesVisible(false);
                        }}
                        >
                        <ThemedText style={{ color: themeAccent, fontWeight: 'bold', fontSize: 15, marginLeft: 8, flexWrap: 'wrap' }}>
                        RNC: {cliente.Rnc}
                        </ThemedText>
                        <ThemedText style={{  fontWeight: '500', fontSize: 15, marginLeft: 8, flexWrap: 'wrap' }}>
                        {cliente.NombreC} <ThemedText style={{ fontWeight: 'bold', color: themeTextSecondary }}>({cliente.IdCliente})</ThemedText>
                        </ThemedText>
                        <ThemedText style={{ color: themeText, fontSize: 13, marginLeft: 8, flexWrap: 'wrap' }}>
                        Zona: {zonasMap[cliente.Idzona] !== undefined ? zonasMap[cliente.Idzona] : ''}, Ruta: {rutasMap[cliente.Idruta] !== undefined ? rutasMap[cliente.Idruta] : ''} 
                        </ThemedText>
                        <ThemedText style={{ color: themeText, fontSize: 13, marginLeft: 8, flexWrap: 'wrap' }}>
                        Tel: {cliente.TelefonoC}
                        </ThemedText>
                        <ThemedText style={{ color: themeText, fontSize: 13, marginLeft: 8, flexWrap: 'wrap' }}>
                        Dirección: {cliente.DireccionC1}
                        </ThemedText>
                        </Pressable>
                        ))
                        )}
                        </ScrollView>
                        )}

                        </Pressable>
                        </Pressable>
                        </Modal>
          </ThemedView>
        ) : (
          <ThemedText type="default">No hay información del vendedor.</ThemedText>
        )}
        {/* Contenedor de productos */}
        <ThemedView style={[styles.productContainer, { backgroundColor: themeBg2, width: '100%' }]}> 
          <View style={styles.productHeader}>
            <ThemedText style={[styles.productTitle, { color: themeAccent }]}>Productos</ThemedText>
            <Pressable style={styles.addButton} onPress={() => setModalProductosVisible(true)}>
              <Feather name="plus" size={20} color={themeText} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.addButtonText, { color: themeText }]}>Agregar</ThemedText>
            </Pressable>
          </View>
          <View style={[styles.productEmptyBox, { backgroundColor: themeBg2 }]}> 
            {productosSeleccionados.length === 0 ? (
              <>
                <Feather name="box" size={48} color={themeAccent} style={{ marginBottom: 0 }} />
                <ThemedText style={[styles.productEmptyText, { color: themeTextSecondary }]}>No hay productos seleccionados</ThemedText>
              </>
            ) : (
              
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingVertical: 8 }}>
                {/* Contenedor de productos seleccionados */}
                {productosSeleccionados.map((p, idx) => (
                  <View 
                    key={p.producto.IdProducto || idx} 
                    style={[{
                      flexDirection: 'column',
                      padding: 12,
                      backgroundColor: themeBg2,
                      borderRadius: 8,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: p.cantidad > (p.producto.ExistenciaP || 0) ? '#ff6b6b' : themeAccent,
                    }]}
                  >
                    {/* Fila 1: Nombre del producto */}
                    <ThemedText style={{ 
                      color: themeAccent, 
                      fontWeight: 'bold', 
                      fontSize: 15, 
                      marginBottom: 4 
                    }}>
                      {p.producto.NombreP}
                    </ThemedText>
                    
                    {/* Fila 2: Código y Presentación */}
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <ThemedText style={{ color: themeTextSecondary, fontSize: 13 }}>
                        {p.producto.CodigoP} | {p.producto.PresentacionP || 'Sin presentación'}
                      </ThemedText>
                      {!isWide && (
                        <ThemedText style={{ color: themeText, fontSize: 15, fontWeight: 'bold' }}>
                          ${p.producto.PrecioP != null ? p.producto.PrecioP.toFixed(2) : '0.00'}
                        </ThemedText>
                      )}
                    </View>
                    
                    {/* Fila 3: Controles de cantidad y precio (en web) */}
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: `${themeText}20`,
                      paddingTop: isWide ? 8 : 16,
                      paddingBottom: isWide ? 4 : 12,
                      paddingHorizontal: 8,
                      minHeight: 64
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: isWide ? '100%' : 'auto' }}>
                        {/* Controles de cantidad */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Pressable onPress={() => setProductosSeleccionados(prev => prev.filter(sel => sel.producto.IdProducto !== p.producto.IdProducto))} style={{ padding: 4, marginRight: 6 }}>
                            <Feather name="trash-2" size={isWide ? 16 : 18} color="#ff6b6b" />
                          </Pressable>
                          
                          <Pressable
                            onPress={() => {
                              setProductosSeleccionados(prev => prev.map(sel => sel.producto.IdProducto === p.producto.IdProducto ? { ...sel, cantidad: Math.max(1, p.cantidad - 1) } : sel));
                            }}
                            style={{
                              width: isWide ? 28 : 40,
                              height: isWide ? 28 : 40,
                              borderRadius: isWide ? 14 : 20,
                              borderWidth: 1,
                              borderColor: themeAccent,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 6,
                              backgroundColor: themeBg2,
                            }}
                            hitSlop={isWide ? 0 : 10}
                          >
                            <Feather name="minus" size={isWide ? 14 : 20} color={themeAccent} />
                          </Pressable>

                          <TextInput
                            style={[{
                              width: isWide ? 36 : 48,
                              height: isWide ? 28 : 40,
                              borderWidth: 1,
                              borderColor: themeAccent,
                              borderRadius: 6,
                              textAlign: 'center',
                              color: themeText,
                              backgroundColor: themeBg2,
                              fontSize: isWide ? 14 : 16,
                              fontWeight: 'bold',
                              padding: 0,
                              marginHorizontal: 2,
                            }]}
                            value={p.cantidad.toString()}
                            keyboardType="numeric"
                            onChangeText={(v) => {
                              const cantidadNum = parseInt(v) || 1;
                              setProductosSeleccionados(prev => prev.map(sel => sel.producto.IdProducto === p.producto.IdProducto ? { ...sel, cantidad: cantidadNum } : sel));
                            }}
                          />

                          <Pressable
                            onPress={() => {
                              const nuevaCantidad = p.cantidad + 1;
                              setProductosSeleccionados(prev => prev.map(sel => sel.producto.IdProducto === p.producto.IdProducto ? { ...sel, cantidad: nuevaCantidad } : sel));
                            }}
                            style={{
                              width: isWide ? 28 : 40,
                              height: isWide ? 28 : 40,
                              borderRadius: isWide ? 14 : 20,
                              borderWidth: 1,
                              borderColor: themeAccent,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: 6,
                              marginRight: isWide ? 16 : 8,
                              backgroundColor: themeBg2,
                            }}
                            hitSlop={isWide ? 0 : 10}
                          >
                            <Feather name="plus" size={isWide ? 14 : 20} color={themeAccent} />
                          </Pressable>
                        </View>
                        
                        {/* Precio en web */}
                        {isWide && (
                          <ThemedText style={{ 
                            color: themeText, 
                            fontSize: 15, 
                            fontWeight: 'bold',
                            minWidth: 80,
                            textAlign: 'right'
                          }}>
                            ${(p.producto.PrecioP * p.cantidad).toFixed(2)}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          {/* Modal para seleccionar productos */}
          <Modal
            visible={modalProductosVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCloseProductoModal}
          >
            <Pressable style={styles.modalOverlay} onPress={handleCloseProductoModal}>
              <Pressable
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: themeBg2,
                    width: '90%',
                    minWidth: 220,
                    padding: 16,
                  },
                ]}
                {...(Platform.OS === 'web' ? { className: 'modal-maxwidth-95vw modal-width-90vw' } : {})}
                onPress={e => e.stopPropagation()}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <ThemedText style={{ color: themeText, fontSize: 18 }}>Seleccionar Producto</ThemedText>
                  <Pressable onPress={handleCloseProductoModal}>
                    <Feather name="x" size={24} color={themeText} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 150, marginBottom: 8, borderWidth: 1, paddingVertical: 0, paddingHorizontal: 2 }}>
                <View style={[styles.searchInputContainer, { borderColor: themeAccent, flex: 1, minWidth: 150, height: 60, alignItems: 'center', justifyContent: 'center',borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 0, paddingHorizontal: 2}]}>
                    <ThemedInput
                      placeholder="Buscar producto..."
                      value={searchProducto}
                      onChangeText={setSearchProducto}
                      editable={!loadingProductos}
                      style={[styles.searchInput, {height: '100%', transform: [{ translateY: 5 }]}]}
                      onSubmitEditing={handleProductSearch} // Buscar con Enter
                    />
                    <Pressable onPress={handleProductSearch} style={styles.searchIcon}>
                      <Feather name="search" size={20} color={themeAccent} />
                    </Pressable>
                  </View>
                </View>
                {loadingProductos ? (
                  <ActivityIndicator color={themeAccent} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView
                    style={styles.clientList}
                    {...(Platform.OS === 'web' ? { className: 'custom-scrollbar' } : {})}
                    contentContainerStyle={{ paddingBottom: 12 }}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={themeAccent === '#fff' ? 'white' : 'black'}
                  >
                    {productosFiltrados.length === 0 ? (
                      <ThemedText style={{ color: themeText, textAlign: 'center', marginTop: 16 }}>No hay productos.</ThemedText>
                    ) : (
                      productosFiltrados.slice(0, 20).map((prod, idx) => {
                        const seleccionado = productosSeleccionados.find(p => p.producto.IdProducto === prod.IdProducto);
                        const inputActivo = productoCantidadInput && productoCantidadInput.id === prod.IdProducto;
                        return (
                          <View key={prod.IdProducto || prod.CodigoP || idx} style={{ width: '100%' }}>
                            <Pressable
                              style={[
                                styles.clientItem,
                                seleccionado ? { borderColor: themeAccent, borderWidth: 2, backgroundColor: themeBg2 } : {},
                                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
                              ]}
                              onPress={() => setProductoCantidadInput({ id: prod.IdProducto, cantidad: seleccionado ? String(seleccionado.cantidad) : productoCantidadInput && productoCantidadInput.id === prod.IdProducto ? productoCantidadInput.cantidad : '1' })}
                            >
                              <View style={{ flex: 1 }}>
                                <ThemedText style={{ color: themeAccent, fontWeight: 'bold', fontSize: 15, marginLeft: 8, flexWrap: 'wrap' }}>
                                  {prod.NombreP}
                                </ThemedText>
                                <ThemedText style={{ fontWeight: '500', fontSize: 15, marginLeft: 8, flexWrap: 'wrap', color: themeTextSecondary }}>
                                  {prod.CodigoP}
                                </ThemedText>
                                <ThemedText style={{ color: themeText, fontSize: 13, marginLeft: 8, flexWrap: 'wrap' }}>
                                  Presentación: {prod.PresentacionP || ''}, Grupo: {prod.GrupoP || ''}
                                </ThemedText>
                                <ThemedText style={{ color: themeText, fontSize: 13, marginLeft: 8, flexWrap: 'wrap' }}>
                                  Precio: ${prod.PrecioP != null ? prod.PrecioP : '-'}
                                </ThemedText>
                              
                              </View>
                              <View style={{ alignItems: 'flex-end', marginRight: 12, minWidth: 80 }}>
                                <ThemedText style={{ 
                                  color: prod.ExistenciaP != null ? (prod.ExistenciaP > 0 ? '#4CAF50' : '#ff6b6b') : themeText, 
                                  fontWeight: 'bold', 
                                  fontSize: 16,
                                  textAlign: 'right'
                                }}>
                                  {prod.ExistenciaP != null ? prod.ExistenciaP : '-'}
                                </ThemedText>
                                <ThemedText style={{ 
                                  color: themeTextSecondary, 
                                  fontSize: 12, 
                                  textAlign: 'right',
                                  marginTop: 2
                                }}>
                                  Existencia
                                </ThemedText>
                              </View>
                              {seleccionado && !inputActivo && (
                                <View style={{ alignItems: 'flex-end', marginRight: 12, marginTop: 20 }}>
                                  <ThemedText style={{ 
                                    color: seleccionado.cantidad > (prod.ExistenciaP || 0) ? '#ff6b6b' : themeAccent, 
                                    fontWeight: 'bold', 
                                    fontSize: 16 
                                  }}>
                                    x{seleccionado.cantidad}
                                  </ThemedText>
                                  {seleccionado.cantidad > (prod.ExistenciaP || 0) && (
                                    <ThemedText style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: 12, marginTop: 2 }}>
                                      ¡Sin stock!
                                    </ThemedText>
                                  )}
                                </View>
                              )}
                              {inputActivo && (
                                <View style={[{
                                  flexDirection: 'row', 
                                  alignItems: 'center', 
                                  marginLeft: 8,
                                }, isWide ? {} : { 
                                  position: 'absolute', 
                                  right: 0, 
                                  top: 0,
                                  backgroundColor: themeBg2,
                                  padding: 8,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: themeAccent,
                                  zIndex: 10
                                }]}>
                                  {/* Botón - */}
                                  <Pressable
                                    onPress={() => {
                                      let nuevaCantidad = Math.max(1, parseInt(productoCantidadInput.cantidad) - 1 || 1);
                                      setProductoCantidadInput({ id: prod.IdProducto, cantidad: String(nuevaCantidad) });
                                    }}
                                    style={{
                                      width: isWide ? 40 : 48,
                                      height: isWide ? 40 : 48,
                                      borderRadius: isWide ? 20 : 24,
                                      borderWidth: 1,
                                      borderColor: themeAccent,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginRight: isWide ? 10 : 8,
                                      backgroundColor: themeBg2,
                                    }}
                                    hitSlop={isWide ? 0 : 10} // Aumentar área táctil en móviles
                                  >
                                    <Feather name="minus" size={isWide ? 24 : 28} color={themeAccent} />
                                  </Pressable>
                                  
                                  {/* Input numérico editable */}
                                  <TextInput
                                    style={[{
                                      borderWidth: 1,
                                      borderColor: themeAccent,
                                      borderRadius: 8,
                                      color: themeText,
                                      backgroundColor: themeBg2,
                                      textAlign: 'center',
                                      fontWeight: 'bold',
                                      marginHorizontal: isWide ? 4 : 8,
                                    }, isWide ? {
                                      width: 48,
                                      height: 40,
                                      fontSize: 22,
                                    } : {
                                      width: 60,
                                      height: 48,
                                      fontSize: 24,
                                    }]}
                                    keyboardType="numeric"
                                    inputMode="numeric"
                                    value={productoCantidadInput.cantidad}
                                    onChangeText={val => {
                                      // Permitir solo números y mínimo 1
                                      let v = val.replace(/[^0-9]/g, '');
                                      if (v === '' || v === '0') v = '1';
                                      const cantidadNum = parseInt(v);
                                      const existencia = prod.ExistenciaP || 0;
                                      
                                      // if (cantidadNum > existencia) {
                                      //   const mensaje = existencia < 0 
                                      //     ? `Advertencia: Está intentando agregar ${cantidadNum} unidades pero la existencia es ${existencia} (negativa).`
                                      //     : `Advertencia: Está intentando agregar ${cantidadNum} unidades pero solo hay ${existencia} en existencia.`;
                                      //   setWarningMessage(mensaje);
                                      //   setShowWarningModal(true);
                                      // }
                                      
                                      setProductoCantidadInput({ id: prod.IdProducto, cantidad: v });
                                    }}
                                    autoFocus
                                    {...(Platform.OS === 'web' ? { inputProps: { type: 'number', min: 1 } } : {})}
                                  />
                                  
                                  {/* Botón + */}
                                  <Pressable
                                    onPress={() => {
                                      let nuevaCantidad = Math.max(1, parseInt(productoCantidadInput.cantidad) + 1 || 1);
                                      const existencia = prod.ExistenciaP || 0;
                                      
                                      // if (nuevaCantidad > existencia) {
                                      //   const mensaje = existencia < 0 
                                      //     ? `Advertencia: Está intentando agregar ${nuevaCantidad} unidades pero la existencia es ${existencia} (negativa).`
                                      //     : `Advertencia: Está intentando agregar ${nuevaCantidad} unidades pero solo hay ${existencia} en existencia.`;
                                      //   setWarningMessage(mensaje);
                                      //   setShowWarningModal(true);
                                      // }
                                      
                                      setProductoCantidadInput({ id: prod.IdProducto, cantidad: String(nuevaCantidad) });
                                    }}
                                    style={{
                                      width: isWide ? 40 : 48,
                                      height: isWide ? 40 : 48,
                                      borderRadius: isWide ? 20 : 24,
                                      borderWidth: 1,
                                      borderColor: themeAccent,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginLeft: isWide ? 10 : 0,
                                      marginRight: isWide ? 0 : 8,
                                      backgroundColor: themeBg2,
                                    }}
                                    hitSlop={isWide ? 0 : 10} // Increase touch area on mobile
                                  >
                                    <Feather name="plus" size={isWide ? 24 : 28} color={themeAccent} />
                                  </Pressable>
                                  
                        
                                 
                                  {/* Botón OK */}
                                  <Pressable
                                    onPress={() => {
                                      const cantidadNum = Math.max(1, parseInt(productoCantidadInput.cantidad) || 1);
                                      const existencia = prod.ExistenciaP || 0;
                                      
                                      // if (cantidadNum > existencia) {
                                      //   const mensaje = existencia < 0 
                                      //     ? `Advertencia: Está intentando agregar ${cantidadNum} unidades pero la existencia es ${existencia} (negativa).`
                                      //     : `Advertencia: Está intentando agregar ${cantidadNum} unidades pero solo hay ${existencia} en existencia.`;
                                      //   setWarningMessage(mensaje);
                                      //   setShowWarningModal(true);
                                      // }
                                      
                                      setProductosSeleccionados(prev => {
                                        const yaExiste = prev.find(p => p.producto.IdProducto === prod.IdProducto);
                                        if (yaExiste) {
                                          return prev.map(p => p.producto.IdProducto === prod.IdProducto ? { ...p, cantidad: cantidadNum } : p);
                                        } else {
                                          return [...prev, { producto: prod, cantidad: cantidadNum }];
                                        }
                                      });
                                      setProductoCantidadInput(null); 
                                      setModalProductosVisible(false); 
                                    }}
                                    style={{ backgroundColor: themeAccent, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 16 }}
                                  >
                                    <ThemedText style={{ color: themeText, fontWeight: 'bold' }}>Agregar</ThemedText>
                                  </Pressable>
                                  {/* Botón cerrar */}
                                  <Pressable
                                    onPress={() => setProductoCantidadInput(null)}
                                    style={{ marginLeft: 8, padding: 4 }}
                                  >
                                    <Feather name="x" size={20} color={themeAccent} />
                                  </Pressable>
                                </View>
                              )}
                            </Pressable>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                )}

              </Pressable>
            </Pressable>
          </Modal>
        </ThemedView>
        {/* Contenedor de resumen de orden */}
        <ThemedView style={{
          marginTop: 32,
          borderRadius: 16,
          padding: 24,
          backgroundColor: themeBg2,
          width: '100%',
          boxShadow: Platform.OS === 'web' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 18, color: themeText }}>Resumen de la Orden</ThemedText>
          {(() => {
            const totalProductos = productosSeleccionados.reduce((acc, p) => acc + (p.producto.PrecioP || 0) * p.cantidad, 0);
            const tipoImpuesto = configData?.TipoImpuesto || 'A';
            const porcentajeImpuesto = parseFloat(configData?.Impuesto || '18') / 100;
            
            let subtotal = 0, itbis = 0, total = 0;
            
            if (totalProductos > 0) {
            if (tipoImpuesto === 'I') {
              // Impuesto incluido: dividir el total por 1.18 para obtener el subtotal
              subtotal = totalProductos / (1 + porcentajeImpuesto);
              itbis = totalProductos - subtotal;
              total = totalProductos;
            } else {
              // Impuesto aplicado: el subtotal es el precio regular, ITBIS se suma
              subtotal = totalProductos;
              itbis = subtotal * porcentajeImpuesto;
              total = subtotal + itbis;
              }
            }
            
            return (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <ThemedText style={{ fontSize: 16, color: themeTextSecondary }}>Subtotal:</ThemedText>
                  <ThemedText style={{ fontSize: 16, color: themeTextSecondary }}>
                    ${subtotal.toFixed(2)}
                  </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <ThemedText style={{ fontSize: 16, color: themeTextSecondary }}>
                    ITBIS ({tipoImpuesto === 'I' ? 'Incluido' : 'Aplicado'}):
                  </ThemedText>
                  <ThemedText style={{ fontSize: 16, color: themeTextSecondary }}>
                    ${itbis.toFixed(2)}
                  </ThemedText>
                </View>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#eee', marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: themeText }}>Total:</ThemedText>
                  <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: themeAccent }}>
                    ${total.toFixed(2)}
                  </ThemedText>
                </View>
              </>
            );
          })()}
          <Pressable
            style={{
              backgroundColor: productosSeleccionados.length === 0 || !selectedClient ? '#a3d3f5' : themeAccent,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 8,
              width: '100%',
              opacity: productosSeleccionados.length === 0 || !selectedClient ? 0.7 : 1,
            }}
            disabled={productosSeleccionados.length === 0 || !selectedClient}
            onPress={handleProcessOrder}
          >
            <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Procesar Orden</ThemedText>
          </Pressable>
          {(!selectedClient || productosSeleccionados.length === 0) && (
            <ThemedText style={{ color: 'red', marginTop: 10, textAlign: 'center', fontSize: 15 }}>
              {(!selectedClient && productosSeleccionados.length === 0)
                ? 'Debe seleccionar un cliente y al menos un producto'
                : (!selectedClient)
                  ? 'Debe seleccionar un cliente'
                  : 'Debe seleccionar al menos un producto'}
            </ThemedText>
          )}
          {/* Modal de confirmación de factura */}
          <Modal
            visible={showFacturaModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setShowFacturaModal(false);
              AsyncStorage.removeItem('lastCreatedOrderId');
            }}
          >
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }} onPress={() => {
              setShowFacturaModal(false);
              AsyncStorage.removeItem('lastCreatedOrderId');
            }}>
              <Pressable
                style={{ backgroundColor: themeBg2, borderRadius: 16, padding: 32, minWidth: 350, alignItems: 'center' }}
                onPress={e => e.stopPropagation()}
              >
                <Feather name="check-circle" size={48} color="#4CAF50" style={{ marginBottom: 16 }} />
                <ThemedText style={{ fontSize: 18, color: themeText, marginBottom: 18, textAlign: 'center' }}>
                  ¡Orden procesada exitosamente!
                </ThemedText>
                <ThemedText style={{ fontSize: 14, color: themeTextSecondary, marginBottom: 20, textAlign: 'center' }}>
                  La orden ha sido guardada en la base de datos.
                </ThemedText>
                <ThemedText style={{ fontSize: 14, color: themeTextSecondary, marginBottom: 24, textAlign: 'center' }}>
                  ¿Desea generar e imprimir la cotización?
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Pressable
                    style={[
                      styles.modalPrintButton,
                      {
                        backgroundColor: isGeneratingFactura ? '#ccc' : '#4CAF50',
                        opacity: isGeneratingFactura ? 0.7 : 1,
                      },
                    ]}
                    onPress={async () => {
                      const lastOrderId = await AsyncStorage.getItem('lastCreatedOrderId');
                      if (lastOrderId) {
                        handlePrintFactura(parseInt(lastOrderId, 10), 'print');
                      } else {
                        alert('No se pudo encontrar el ID de la orden');
                      }
                    }}
                    disabled={isGeneratingFactura}
                  >
                    {isGeneratingFactura ? (
                      <ActivityIndicator size="small" color={themeText} />
                    ) : (
                      <Feather name="printer" size={18} color={themeText} />
                    )}
                    <ThemedText style={[styles.modalPrintButtonText, { color: themeText }]}>
                      {isGeneratingFactura ? 'Generando...' : 'Imprimir Cotización'}
                    </ThemedText>
                  </Pressable>

                  {showPrintOptions && (
                    <ThemedView style={[styles.printOptionsContainer, { backgroundColor: themeBg }]}>
                      <Pressable 
                        style={styles.printOptionButton} 
                        onPress={async () => {
                          const lastOrderId = await AsyncStorage.getItem('lastCreatedOrderId');
                          if (lastOrderId) {
                            handlePrintFactura(parseInt(lastOrderId, 10), 'download');
                          }
                        }}
                      >
                        <Feather name="download" size={16} color={themeText} />
                        <ThemedText style={styles.printOptionText}>Descargar Cotización</ThemedText>
                      </Pressable>
                    </ThemedView>
                  )}
                </View>
                  <Pressable
                    style={{ 
                      backgroundColor: 'transparent', 
                      borderRadius: 8, 
                      paddingVertical: 12, 
                      paddingHorizontal: 20,
                      borderWidth: 1,
                      borderColor: themeAccent
                    }}
                    onPress={() => {
                      setShowFacturaModal(false);
                      AsyncStorage.removeItem('lastCreatedOrderId');
                    }}
                    disabled={isGeneratingFactura}
                  >
                    <ThemedText style={{ color: themeAccent, fontWeight: 'bold', fontSize: 16 }}>Solo Aceptar</ThemedText>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </ThemedView>
        
        {/* Modal de advertencia temporal
        <Modal
          visible={showWarningModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarningModal(false)}
        >
          <Pressable 
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }} 
            onPress={() => setShowWarningModal(false)}
          >
            <Pressable
              style={{ 
                backgroundColor: themeBg2, 
                borderRadius: 16, 
                padding: 24, 
                minWidth: 300, 
                maxWidth: 400,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#ff6b6b'
              }}
              onPress={e => e.stopPropagation()}
            >
              <Feather name="alert-triangle" size={48} color="#ff6b6b" style={{ marginBottom: 16 }} />
              <ThemedText style={{ 
                fontSize: 16, 
                color: themeText, 
                marginBottom: 16, 
                textAlign: 'center',
                lineHeight: 22
              }}>
                {warningMessage}
              </ThemedText>
              <ThemedText style={{ 
                fontSize: 14, 
                color: themeTextSecondary, 
                marginBottom: 20, 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                El producto se agregará con la cantidad especificada.
              </ThemedText>
              <Pressable
                style={{ 
                  backgroundColor: '#ff6b6b', 
                  borderRadius: 8, 
                  paddingVertical: 12, 
                  paddingHorizontal: 24 
                }}
                onPress={() => setShowWarningModal(false)}
              >
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entendido</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal> */}

        {/* Modal de advertencia de orden en proceso */}
        <Modal
          visible={showOrderInProgressModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOrderInProgressModal(false)}
        >
          <Pressable 
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }} 
            onPress={() => setShowOrderInProgressModal(false)}
          >
            <Pressable
              style={{ 
                backgroundColor: themeBg2, 
                borderRadius: 16, 
                padding: 24, 
                minWidth: 300, 
                maxWidth: 400,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#ff6b6b'
              }}
              onPress={e => e.stopPropagation()}
            >
              <Feather name="alert-triangle" size={48} color="#ff6b6b" style={{ marginBottom: 16 }} />
              <ThemedText style={{ 
                fontSize: 16, 
                color: themeText, 
                marginBottom: 16, 
                textAlign: 'center',
                lineHeight: 22
              }}>
                ¡Tiene una orden en proceso!
              </ThemedText>
              <ThemedText style={{ 
                fontSize: 14, 
                color: themeTextSecondary, 
                marginBottom: 20, 
                textAlign: 'center',
                lineHeight: 20
              }}>
                {selectedClient && productosSeleccionados.length > 0 
                  ? `Cliente: ${selectedClient.NombreC} (${productosSeleccionados.length} productos)`
                  : selectedClient 
                    ? `Cliente: ${selectedClient.NombreC}`
                    : `${productosSeleccionados.length} productos agregados`
                }
              </ThemedText>
              <ThemedText style={{ 
                fontSize: 14, 
                color: themeTextSecondary, 
                marginBottom: 20, 
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Si sale ahora, perderá el progreso de la orden.
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={{ 
                    backgroundColor: '#ff6b6b', 
                    borderRadius: 8, 
                    paddingVertical: 12, 
                    paddingHorizontal: 20 
                  }}
                  onPress={() => {
                    clearOrderInProgress();
                    setShowOrderInProgressModal(false);
                  }}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Descartar Orden</ThemedText>
                </Pressable>
                <Pressable
                  style={{ 
                    backgroundColor: themeAccent, 
                    borderRadius: 8, 
                    paddingVertical: 12, 
                    paddingHorizontal: 20 
                  }}
                  onPress={() => setShowOrderInProgressModal(false)}
                >
                  <ThemedText style={{ color: themeText, fontWeight: 'bold', fontSize: 16 }}>Continuar</ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>


        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    borderRadius: 12,
    padding: 0,
    width: '38%',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Picker Button Styles
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal Picker Styles
  // Modal styles are defined below with the rest of the modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedItem: {
    backgroundColor: '#68a5e6ff',
  },
  filterContainer: {
    width: '100%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    justifyContent: 'center',
    width: 'auto',
    alignSelf: 'center',
  },
  infoCol: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  iconCol: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingRight: 20,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'left',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 24,
    width: '100%',
    marginTop: 20,
  },
  selectBox: {
    borderRadius: 12,
    padding: 24,
    width: '38%',
    minHeight: 180,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 28,
    // minWidth: 320,
    // maxWidth: 400,
    maxHeight: 480,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  searchInput: {
    width: '100%',
    fontSize: 16,
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  clientList: {
    width: '100%',
    maxHeight: 260,
    borderRadius: 8,
    backgroundColor: 'transparent',
    // No uso scrollbarWidth ni scrollbarColor aquí para evitar errores de linter
  },
  clientItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 2,
    width: '100%',
  },
  productContainer: {
    marginTop: 32,
    borderRadius: 16,
    padding: 16,
    boxShadow: Platform.OS === 'web' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addButtonText: {
    fontWeight: '500',
    fontSize: 17,
  },
  productEmptyBox: {
    // backgroundColor se sobreescribe con themeBg2
    borderRadius: 12,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 16,
  },
  productEmptyText: {
    fontSize: 16,
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    padding: 8,
  },
  logoContainer: {
    borderRadius: 12,
    padding: 0,
    width: '20%',
    minHeight: 120,
    maxHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  logoImage: {
    width: '90%',
    height: '90%',
    borderRadius: 0,
  },
  editingInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 16,
  },
  editingInfoText: {
    fontSize: 16,
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cancelEditButtonText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  // Print button styles
  modalPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  modalPrintButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  printOptionsContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  printOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  printOptionText: {
    fontSize: 14,
    color: '#333',
  },
});
