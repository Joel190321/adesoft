import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiUrl } from '@/config';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Stack, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import { ActivityIndicator, Alert, Dimensions, Linking, LogBox, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

LogBox.ignoreAllLogs(true);

interface Transaccion {
  IdTransa: number;
  Documento?: string;
  Tipo?: 'VE' | 'IN';
  Fecha: string;
  FechaCreacion?: string;
  IdCliente: string;
  IdVendedor: string;
  Valor?: number;
  Efectivo?: number;
  Tarjeta?: number;
  Cheque?: number;
  Transferencia?: number;
  Pendiente?: number;
  ValorImp?: number;
  ReferenciaId?: string;
  Concepto?: string;
  FechaSinc?: string;
  Cliente?: {
    IdCliente: string;
    NombreC: string;
    Rnc?: string;
  };
  Vendedor?: {
    IdVendedor: string;
    NombreV: string;
  };
  ReferenciaPago?: Array<{
    IdReferencia: number;
    IdTransa: number;
    DocumentoIN?: string;
    DocumentoVE?: string;
    IdCliente: string;
    IdVendedor: string;
    ValorPago?: number;
    CreatedAt?: string;
    Efectivo?: number;
    Tarjeta?: number;
    Cheque?: number;
    Transferencia?: number;
  }>;
}

export default function Transacciones() {
  // Utilidad para obtener el valor real de un campo de pago de la referencia seleccionada
  function getReferenciaPagoField(field: 'Efectivo' | 'Tarjeta' | 'Cheque' | 'Transferencia' | 'ValorPago') {
    if (!selectedTransaccion || !referenciaSeleccionada || !referenciaSeleccionada.DocumentoIN) return undefined;
    const ref = selectedTransaccion.ReferenciaPago?.find(r => r.DocumentoIN === referenciaSeleccionada.DocumentoIN);
    return ref ? ref[field] : undefined;
  }
  const [showReferenciaDetail, setShowReferenciaDetail] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState<any>(null);
  let today = new Date();
  const [date, setDate] = useState(dayjs());
  const defaultStyles = useDefaultStyles();
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>('thermal');
  const [vendor, setVendor] = useState<{ IdVendedor?: string; NombreV?: string, IdRuta?: string } | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchInput, setSearchInput] = useState(''); // texto que escribe el usuario
const [searchQuery, setSearchQuery] = useState(''); // query aplicada al filtrar
  const [filterTipo, setFilterTipo] = useState<string>('VE');
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filterVendedor, setFilterVendedor] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [rutasMap, setRutasMap] = useState<{ [key: string]: string }>({});
  const [rutas, setRutas] = useState<any[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  const [zonas, setZonas] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const [zonasMap, setZonasMap] = useState<{ [key: string]: string }>({});
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 8);
  const [width1, setWidth1] = useState(Dimensions.get('window').width);
  const [showRutaPicker, setShowRutaPicker] = useState(false);
  const [showZonaPicker, setShowZonaPicker] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setWidth1(width);
      setIsMobile(width < 768);
      setIsNarrow(width < 500);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);
  const [isWide, setIsWide] = useState(() => Dimensions.get('window').width > 850);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [clientesMap, setClientesMap] = useState<{ [key: string]: any }>({});
  const [vendedoresMap, setVendedoresMap] = useState<{ [key: string]: any }>({});
  const [showReferenciaForm, setShowReferenciaForm] = useState(false);
  const { width } = useWindowDimensions();

  // ReferenciaPago form state
  const [referenciaPagoForm, setReferenciaPagoForm] = useState({
    DocumentoVE: '',
    IdCliente: '',
    IdVendedor: '',
    ValorPago: ''
    // DocumentoIN se generará al momento de enviar el formulario
    // IdTransa y CreatedAt se gestionan automáticamente
  });
  const [isSubmittingReferencia, setIsSubmittingReferencia] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastDocumentoIN, setLastDocumentoIN] = useState('');
  const [isPaymentHistoryExpanded, setIsPaymentHistoryExpanded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingFactura, setIsGeneratingFactura] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [paymentReferences, setPaymentReferences] = useState<any[]>([]);

  // Fetch payment references by document and type
  const fetchPaymentReferences = async (documento: string, tipo: 'VE' | 'IN') => {
    if (!documento) return;
    
    setLoadingReferences(true);
    try {
      const response = await fetch(`${apiUrl}transacciones/referencias/${documento}/${tipo}`);
      if (response.ok) {
        const data = await response.json();
        // If it's an IN type, it returns the transaction with references
        // If it's a VE type, it returns an array of references
        const references = tipo === 'IN' ? (data.ReferenciaPago || []) : data;
        setPaymentReferences(Array.isArray(references) ? references : []);
      } else {
        console.error('Error fetching references:', await response.text());
        setPaymentReferences([]);
      }
    } catch (error) {
      console.error('Error fetching references:', error);
      setPaymentReferences([]);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Formatear fecha al formato DD-MM-YYYY
  const formatDateToDDMMYYYY = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Convertir de DD-MM-YYYY a YYYY-MM-DD para el estado interno
  const formatDateToYYYYMMDD = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  };

  // Formatear de YYYY-MM-DD a DD-MM-YYYY
  const formatToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  // Formatear de DD-MM-YYYY a YYYY-MM-DD
  const formatToYYYYMMDD = (dateStr: string) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  };

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  // Format date to display in a more readable format
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`; // Display as DD/MM/YYYY
  };
  const handlePrintComprobante = async (
    documento: number,
    action: "open" | "download" | "print",
    paperSize: string = "thermal" // por defecto
  ) => {
    try {
      // Generar comprobante desde el backend
      const response = await fetch(
        `${apiUrl}facturas/transaccion-in/${documento}?paperSize=${encodeURIComponent(
          paperSize
        )}`
      );
  
      if (!response.ok) {
        throw new Error(`Error generando comprobante: ${response.status}`);
      }
  
      // === Manejo en móviles ===
      if (Platform.OS !== "web") {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
  
        return new Promise((resolve) => {
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const pdfData = base64data.split(",")[1];
            const fileName = `COMP-${String(documento).padStart(8, "0")}.pdf`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  
            try {
              // Guardar PDF local
              await FileSystem.writeAsStringAsync(fileUri, pdfData, {
                encoding: FileSystem.EncodingType.Base64,
              });
  
              if (action === "open") {
                await Sharing.shareAsync(fileUri, {
                  mimeType: "application/pdf",
                  dialogTitle: `Comprobante ${documento}`,
                  UTI: "com.adobe.pdf",
                });
              } else if (action === "print") {
                try {
                  await Print.printAsync({
                    uri: fileUri,
                    orientation: "portrait",
                    useMarkupFormatter: true,
                    margins: { left: 0, right: 0, top: 0, bottom: 0 },
                  });
                } catch (err) {
                  console.warn("Error al imprimir, abriendo para compartir:", err);
                  await Sharing.shareAsync(fileUri, {
                    mimeType: "application/pdf",
                    dialogTitle: `Comprobante ${documento}`,
                    UTI: "com.adobe.pdf",
                  });
                }
              } else {
                await Sharing.shareAsync(fileUri, {
                  mimeType: "application/pdf",
                  dialogTitle: `Descargar comprobante ${documento}`,
                  UTI: "com.adobe.pdf",
                });
              }
  
              // Borrar archivo temporal después de 1 minuto
              setTimeout(async () => {
                try {
                  await FileSystem.deleteAsync(fileUri, { idempotent: true });
                } catch (e) {
                  console.warn("Error eliminando archivo temporal:", e);
                }
              }, 60000);
            } catch (error) {
              console.error("Error manejando PDF:", error);
            } finally {
              setShowPrintOptions(false);
              resolve(null);
            }
          };
        });
      }
  
      // === Manejo en Web ===
      const rawBlob = await response.blob();
      const blob = new Blob([rawBlob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
  
      if (action === "open" || action === "print") {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
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
              printWindow.document.title = `COMP-${String(documento).padStart(
                8,
                "0"
              )}.pdf`;
            } catch (e) {}
  
            if (action === "print") {
              printWindow.focus();
              printWindow.print();
            }
  
            printWindow.addEventListener("afterprint", removeIframeAndRevoke);
            setTimeout(removeIframeAndRevoke, 30000);
          } else {
            setTimeout(removeIframeAndRevoke, 3000);
          }
        };
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `COMP-${String(documento).padStart(8, "0")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error printing comprobante:", error);
      Alert.alert("Error", "No se pudo abrir el comprobante");
    } finally {
      setShowPrintOptions(false);
    }
  };
  // Clear references when closing details modal
  useEffect(() => {
    if (!showDetailsModal) {
      setPaymentReferences([]);
      setIsPaymentHistoryExpanded(false);
    }
  }, [showDetailsModal]);

  // Handle date selection from the picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker is closed after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFecha(formattedDate);
    }
  };
  const [concepto, setConcepto] = useState('');
  // Definir el tipo para el estado de pagos
  type PagosState = {
    efectivo: string;
    tarjeta: string;
    transferencia: string;
    cheque: string;
  };

  const [pagos, setPagos] = useState<PagosState>({
    efectivo: '',
    tarjeta: '',
    transferencia: '',
    cheque: ''
  });
  const [isPaymentValid, setIsPaymentValid] = useState(true);
  
  // Función para resetear el formulario de pago
  const resetPaymentForm = () => {
    setPagos({
      efectivo: '',
      tarjeta: '',
      transferencia: '',
      cheque: ''
    });
    setConcepto('');
  };

  const handleShowReferenciaDetail = async (referencia: any) => {
    setReferenciaSeleccionada(referencia);
    if (referencia.DocumentoIN) {
      await FetchIngresoByDocumento(referencia.DocumentoIN);
    }
    setShowReferenciaDetail(true);
  };

  // Load references when transaction is selected
  useEffect(() => {
    if (selectedTransaccion?.Documento && selectedTransaccion.Tipo) {
      fetchPaymentReferences(selectedTransaccion.Documento, selectedTransaccion.Tipo);
    } else {
      setPaymentReferences([]);
    }
  }, [selectedTransaccion]);
  
  // Función para manejar el cierre del modal
  const handleClosePaymentModal = () => {
    resetPaymentForm();
    setShowPaymentModal(false);
  };
  // Obtener configuración de impuestos
  const [configData, setConfigData] = React.useState<any>(null);
  
  // Cargar configuración al montar el componente
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await AsyncStorage.getItem('configData');
        if (config) {
          setConfigData(JSON.parse(config));
        } else {
          // Si no hay configuración guardada, usar valores por defecto
          setConfigData({
            TipoImpuesto: 'A', // 'A' para aditivo (impuesto se suma), 'I' para inclusivo (impuesto ya está incluido)
            Impuesto: '18' // Porcentaje de impuesto
          });
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
        // Usar valores por defecto en caso de error
        setConfigData({
          TipoImpuesto: 'A',
          Impuesto: '18'
        });
      }
    };
    
    loadConfig();
  }, []);

  // Calcular el total con impuesto siempre en 0
  const { total, impuesto, subtotal } = React.useMemo(() => {
    const totalBruto = Object.values(pagos).reduce((sum, value) => sum + (Number(value) || 0), 0);
    
    return { 
      total: totalBruto, 
      impuesto: 0, // Impuesto siempre 0
      subtotal: totalBruto // El subtotal es igual al total ya que no hay impuesto
    };
  }, [pagos, configData]);

  const fetchClients = async (query?: string, idruta?: string, idzona?: string) => {
    setLoadingClients(true);
    try {
      let url = `${apiUrl}clientes`;
      const params = [];
      if (query && query.trim() !== '') params.push(`q=${encodeURIComponent(query)}`);
      if (idruta && idruta !== '') params.push(`Idruta=${encodeURIComponent(idruta)}`);
      if (idzona && idzona !== '') params.push(`Idzona=${encodeURIComponent(idzona)}`);
      if (params.length > 0) url += '/search?' + params.join('&');
  
      const response = await fetch(url);
      const data = await response.json();
  
      setClients(Array.isArray(data) ? data : []);
      setFilteredClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoadingClients(false);
    }
  };
  // Initialize client search when modal opens or filters change
  useEffect(() => {
    if (modalVisible) {
      fetchClients(search, rutaSeleccionada, zonaSeleccionada);
    }
  }, [modalVisible, rutaSeleccionada, zonaSeleccionada]);

  const handleClientSearch = (searchTerm: string) => {
    fetchClients(searchTerm, rutaSeleccionada, zonaSeleccionada);
  };
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleClientSearch(clientSearchInput);
    }
  };

  const handleCloseClienteModal = () => {
    setModalVisible(false);
    setSearch('');
    setRutaSeleccionada('');
    setZonaSeleccionada('');
  };

  const cargarNombresRutas = async () => {
    try {
      const response = await fetch(`${apiUrl}rutas`);
      const data = await response.json();
      setRutas(data);
      const map = data.reduce((acc: any, ruta: any) => {
        acc[ruta.Idruta] = ruta.Ruta;
        return acc;
      }, {});
      setRutasMap(map);
    } catch (error) {
      console.error('Error fetching rutas:', error);
    }
  };

  const cargarNombresZonas = async () => {
    try {
      const response = await fetch(`${apiUrl}zonas`);
      const data = await response.json();
      setZonas(data);
      const map = data.reduce((acc: any, zona: any) => {
        acc[zona.Idzona] = zona.Zona;
        return acc;
      }, {});
      setZonasMap(map);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  useEffect(() => {
    const updateLayout = () => {
      const width = Dimensions.get('window').width;
      setWindowWidth(width);
      setIsNarrow(width < 600);
      setIsWide(width > 850);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    updateLayout();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (vendor?.IdRuta) {
      fetchClients(undefined, vendor.IdRuta);
    } else {
      fetchClients();
    }
    cargarNombresRutas();
    cargarNombresZonas();
  }, [vendor]);

  useEffect(() => {
    if (!showDetailsModal) {
      setShowReferenciaForm(false);
    }
  }, [showDetailsModal]);

  useFocusEffect(
    React.useCallback(() => {
      loadVendor();
    }, [])
  );

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
    
  const themeBg = useThemeColor({}, 'background');
  const themeBg2 = useThemeColor({}, 'backgroundSecondary');
  const themeText = useThemeColor({}, 'text');
  const themeTextSecondary = useThemeColor({}, 'textSecondary');
  const themeAccent = useThemeColor({}, 'tint');
  const themeBg3 = useThemeColor({}, 'backgroundTertiary');

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Adesoft - Transacciones';
    }
    fetchTransacciones();
  }, []);

  // Llama fetchTransacciones cuando cambia filterTipo
  useEffect(() => {
    fetchTransacciones();
  }, [filterTipo]);


  // Fetch client by ID
  const fetchCliente = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}clientes/${id}`);
      if (response.ok) {
        const cliente = await response.json();
        setClientesMap(prev => ({ ...prev, [id]: cliente }));
      }
    } catch (error) {
      console.error('Error fetching cliente:', error);
    }
  };

  // Fetch vendor by ID
  // Always fetch the logged-in vendor from AsyncStorage
const fetchVendedor = async () => {
  try {
    const vendorData = await AsyncStorage.getItem('currentVendor');
    const vendedorActual = vendorData && vendorData !== 'undefined' ? JSON.parse(vendorData) : null;
    const vendedorId = vendedorActual?.IdVendedor;
    if (!vendedorId) {
      console.warn('No se pudo determinar el IdVendedor para fetchVendedor');
      return;
    }
    const response = await fetch(`${apiUrl}vendedores/${vendedorId}`);
    if (response.ok) {
      const vendedor = await response.json();
    } else {
      // Si el vendedor no existe (404), solo mostramos un warning y NO lanzamos error, así no entra al catch
      if (response.status === 404) {
        console.warn(`El vendedor con ID ${vendedorId} no tiene ruta o no existe.`);
        // Aquí puedes agregar lógica adicional si necesitas manejar este caso en la UI
        return;
      } else {
        const errorText = await response.text();
        throw new Error(`Error al obtener vendedor: ${response.status} - ${errorText}`);
      }
    }
  } catch (error: any) {
    console.log('Error fetching vendedor:', error.message || error);
  }
};

// Fetch all vendedores and update the vendedoresMap
const fetchAllVendedores = async () => {
  try {
    const response = await fetch(`${apiUrl}vendedores`);
    if (response.ok) {
      const vendedores = await response.json();
      // Create a new map with all vendors
      const newVendedoresMap = vendedores.reduce((acc: { [key: string]: any }, vendedor: any) => {
        acc[vendedor.IdVendedor] = vendedor;
        return acc;
      }, {});
      setVendedoresMap(newVendedoresMap);
    } else {
      const errorText = await response.text();
      console.error('Error al obtener la lista de vendedores:', errorText);
    }
  } catch (error: any) {
    console.error('Error fetching vendedores:', error.message || error);
  }
};
  // Fetch client and vendor data for transactions
  const fetchClientesYVendedores = async (transacciones: Transaccion[]) => {
    try {
      // Get unique client and vendor IDs
      const clienteIds = [...new Set(transacciones.map(t => t.IdCliente))];
      const vendedorIds = [...new Set(transacciones.map(t => t.IdVendedor))];

      // Filter out already fetched clients and vendors
      const newClienteIds = clienteIds.filter(id => !clientesMap[id]);
      const newVendedorIds = vendedorIds.filter(id => !vendedoresMap[id]);

      // Fetch new clients and vendors in parallel
      await Promise.all([
        ...newClienteIds.map(id => fetchCliente(id)),
        ...newVendedorIds.map(id => fetchVendedor()),
        fetchAllVendedores(),
      ]);
    } catch (error) {
      console.error('Error fetching clientes y vendedores:', error);
    }
  };

  // Fetch transactions when selectedClient changes
  useEffect(() => {
    fetchTransacciones();
  }, [selectedClient, searchQuery, filterTipo]);

  // Aplicar filtros automáticamente
  useEffect(() => {
    if (vendor) { // Solo ejecutar si el vendedor ya se ha cargado
      const debouncedFetch = setTimeout(() => {
        fetchTransacciones();
      }, 500);

      return () => clearTimeout(debouncedFetch);
    }
  }, [searchQuery, filterTipo, vendor]);

  const fetchTransacciones = async () => {
    setLoading(true);
    try {
      // Si el filtro es IN, llamar a la ruta de ingresos
      if (filterTipo === 'IN') {
  let url = `${apiUrl}transacciones/ingresos`;
  const params = new URLSearchParams();

  if (selectedClient) {
    url = `${apiUrl}transacciones/ingresos`;
    params.append('IdCliente', selectedClient.IdCliente);
  }
  if (searchQuery && searchQuery.trim() !== '') {
    params.append('Documento', searchQuery.trim());
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (response.ok) {
    let data = await response.json();
    setTransacciones(data);
    if (data.length > 0) {
      await fetchClientesYVendedores(data);
    }
  } else {
    setTransacciones([]);
  }
  setLoading(false);
  return;
}
      // Lógica original para VE
      if (!vendor?.IdVendedor) {
        setLoading(false);
        return;
      }

      let url: string | undefined;
      // Si el vendedor no tiene ruta, trae todas las transacciones pendientes y desactiva búsqueda por id
      if (!vendor?.IdRuta) {
        url = `${apiUrl}transacciones/pendientes`;
      } else if (selectedClient) {
        url = `${apiUrl}transacciones/pendientes/cliente/${selectedClient.IdCliente}`;
      }  if (vendor?.IdRuta !== null) {
        url = `${apiUrl}transacciones/pendientes/vendedor/${vendor?.IdVendedor}`;
      }

      if (!url) {
        setLoading(false);
        throw new Error('No se pudo determinar la URL para obtener transacciones.');
      }
      
      const params = new URLSearchParams();

      // Siempre agrega los filtros de búsqueda (Documento y Tipo) si existen
      if (searchQuery) {
        params.append('Documento', searchQuery);
      }
      if (filterTipo) {
        params.append('Tipo', filterTipo);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setTransacciones(data);
        // Fetch related client and vendor data
        if (data.length > 0) {
          await fetchClientesYVendedores(data);
        }
      } else {
        console.error('Error fetching transacciones:', response.statusText);
        setTransacciones([]);
      }
    } catch (error) {
      console.error('Error fetching transacciones:', error);
      setTransacciones([]);
    } finally {
      setLoading(false);
    }
  };

  const FetchIngresoByDocumento = async (documento: string) => {
    try {
      const response = await fetch(`${apiUrl}transacciones/info-ingreso/${documento}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTransaccion(data);
        console.log(data);
      } else {
        console.error('Error fetching transaccion:', response.statusText);
        setSelectedTransaccion(null);
      }
    } catch (error) {
      console.error('Error fetching transaccion:', error);
      setSelectedTransaccion(null);
    }
  };

  // Function to check if payment is valid (total <= pending amount)
  const validatePayment = (pagos: PagosState): boolean => {
    if (!selectedTransaccion || selectedTransaccion.Pendiente === undefined) return false;
    
    const totalPago = Object.values(pagos).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
    
    return totalPago > 0 && totalPago <= (selectedTransaccion.Pendiente || 0);
  };

  // Update payment validation whenever pagos or selected transaction changes
  useEffect(() => {
    if (showPaymentModal) {
      // Buscar el último IdTransa y formatear como DocumentoIN
      if (transacciones.length > 0) {
        const maxId = Math.max(...transacciones.map(t => t.IdTransa));
        const nextId = maxId + 1;
        const nextDocumentoIN = nextId.toString().padStart(8, '0');
        setLastDocumentoIN(nextDocumentoIN);
      } else {
        setLastDocumentoIN('00000001');
      }
    }
  }, [showPaymentModal, transacciones]);

  useEffect(() => {
    if (selectedTransaccion) {
      setIsPaymentValid(validatePayment(pagos));
    }
  }, [pagos, selectedTransaccion]);

  const handlePaymentChange = (method: keyof PagosState, value: string) => {
    // Allow only numbers and one decimal point
    const regex = /^\d*\.?\d{0,2}$/;
    
    if (value === '' || regex.test(value)) {
      setPagos(prevPagos => {
        const newPagos = {
          ...prevPagos,
          [method]: value
        };
        
        // Update validation state
        setIsPaymentValid(validatePayment(newPagos));
        
        return newPagos;
      });
    }
  };

  
  // Utilidad para obtener el siguiente Documento IN (8 dígitos, basado en el mayor IdReferencia)
  const getNextDocumentoIN = () => {
    let maxId = 0;
    transacciones.forEach(tr => {
      tr.ReferenciaPago?.forEach(ref => {
        if (typeof ref.IdReferencia === 'number' && ref.IdReferencia > maxId) {
          maxId = ref.IdReferencia;
        }
      });
    });
    // Siguiente número secuencial
    const nextId = maxId + 1;
    // Retornar como string de 8 dígitos, rellenando con ceros a la izquierda
    return nextId.toString().padStart(8, '0');
  };

  const handleViewDetails = async (transaccion: Transaccion) => {
    setSelectedTransaccion(transaccion);
    // Usar estado vendor para IdVendedor
    setReferenciaPagoForm({
      DocumentoVE: '',
      IdCliente: transaccion.IdCliente,
      IdVendedor: vendor?.IdVendedor || '',
      ValorPago: ''
    });
    setShowDetailsModal(true);
  };

  

  // Utilidad para formatear fecha y hora con AM/PM como en Ordenes.tsx
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
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

  const getTipoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'VE': return 'Factura';
      case 'IN': return 'Ingreso';
      default: return 'N/A';
    }
  };

  const getTipoColor = (tipo?: string) => {
    switch (tipo) {
      case 'VE': return '#4CAF50';
      case 'IN': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterTipo('');
    setFilteredClients([]);
    setFilterVendedor('');
    setSelectedClient(null); // Clear the selected client when clearing filters
    // Also clear the client search filters
    setSearch('');
    setRutaSeleccionada('');
    setZonaSeleccionada('');
  };

  const handleReferenciaPagoSubmit = async () => {
    if (!selectedTransaccion) {
      alert("No se ha seleccionado ninguna transacción");
      return;
    }
  
    try {
      // Calcular el total
      const totalPago =
        parseFloat(pagos.efectivo || "0") +
        parseFloat(pagos.tarjeta || "0") +
        parseFloat(pagos.transferencia || "0") +
        parseFloat(pagos.cheque || "0");
      
      console.log("Monto total del pago:", totalPago);
      console.log("Monto pendiente:", selectedTransaccion.Pendiente);
  
      if (
        totalPago <= 0 ||
        (selectedTransaccion?.Pendiente !== undefined &&
          totalPago > selectedTransaccion.Pendiente)
      ) {
        const errorMsg = `El monto total del pago (${totalPago}) no puede exceder el monto pendiente (${selectedTransaccion.Pendiente})`;
        console.error(errorMsg);
        alert(errorMsg);
        return;
      }
  
      setIsSubmittingReferencia(true);
  
      // Validar que el vendedor esté definido
      if (!vendor?.IdVendedor) {
        throw new Error("No se pudo obtener la información del vendedor");
      }

      // Validar que la transacción tenga un ID
      if (!selectedTransaccion.IdTransa) {
        throw new Error("La transacción seleccionada no tiene un ID válido");
      }

      // Manejo de fechas mejorado
      const fechaActual = dayjs();
      const fechaSeleccionada = dayjs.isDayjs(date) ? date : fechaActual;
      // Formatear la fecha como ISO-8601 (YYYY-MM-DDTHH:mm:ss.SSSZ)
      const formattedDate = fechaSeleccionada.toISOString();
      
      console.log("Fecha formateada para el pago:", formattedDate);
  
      const fetchBody = {
        transaccionData: {
          Fecha: formattedDate,
          IdCliente: selectedTransaccion.IdCliente,
          IdVendedor: vendor.IdVendedor,
          Valor: totalPago,
          ValorImp: 0, // Siempre en 0 según el código anterior
          Concepto: concepto || (selectedTransaccion.Pendiente === totalPago
            ? `Pago de factura #${selectedTransaccion.Documento || ""}`
            : `Abono a factura #${selectedTransaccion.Documento || ""}`),
          Efectivo: parseFloat(pagos.efectivo) || 0,
          Tarjeta: parseFloat(pagos.tarjeta) || 0,
          Transferencia: parseFloat(pagos.transferencia) || 0,
          Cheque: parseFloat(pagos.cheque) || 0,
        },
        transaccionOriginalId: selectedTransaccion.IdTransa,
        montoPago: totalPago,
      };
      
      console.log("Datos a enviar al servidor:", JSON.stringify(fetchBody, null, 2));
  
      const response = await fetch(`${apiUrl}transacciones/ingreso-pago`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(fetchBody),
      });
  
      if (!response.ok) {
        let errorMessage = "Error al procesar el pago";
        try {
          const errorData = await response.json();
          console.error("Error del servidor:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error("Error al procesar la respuesta de error:", e);
        }
        throw new Error(`${errorMessage} (Código: ${response.status})`);
      }
  
      const result = await response.json();
      console.log("Respuesta recibida del servidor:", result);
  
      if (
        !result.ingreso ||
        typeof result.ingreso.IdTransa === "undefined" ||
        result.ingreso.IdTransa === null
      ) {
        throw new Error(
          "No se recibió la transacción IN creada del backend. Por favor verifique la respuesta del servidor."
        );
      }
  
      const idTransaIN = result.ingreso.IdTransa;
  
      if (selectedTransaccion.Pendiente !== undefined) {
        const updatedPendiente = selectedTransaccion.Pendiente - totalPago;
        const newReferencia = {
          IdReferencia: result.referencia.IdReferencia,
          IdTransa: idTransaIN,
          DocumentoIN: result.ingreso.Documento,
          DocumentoVE: selectedTransaccion.Documento || "",
          IdCliente: selectedTransaccion.IdCliente,
          IdVendedor: vendor.IdVendedor,
          ValorPago: totalPago,
          CreatedAt: new Date().toISOString(),
        };
  
        const updatedSelectedTransaccion = {
          ...selectedTransaccion,
          IdTransa: idTransaIN,
          Pendiente: updatedPendiente > 0 ? updatedPendiente : 0,
          ReferenciaPago: [
            ...(selectedTransaccion.ReferenciaPago || []),
            newReferencia,
          ],
        };
  
        setSelectedTransaccion(updatedSelectedTransaccion);
  
        setTransacciones((prevTransacciones) =>
          prevTransacciones.map((t) =>
            t.IdTransa === selectedTransaccion.IdTransa
              ? {
                  ...t,
                  IdTransa: idTransaIN,
                  Pendiente: updatedPendiente > 0 ? updatedPendiente : 0,
                  ReferenciaPago: [
                    ...(t.ReferenciaPago || []),
                    newReferencia,
                  ],
                }
              : t
          )
        );
      }
  
      setShowPaymentModal(false);
      setLastDocumentoIN(result.ingreso.Documento || "");
      setShowSuccessModal(true);
  
      fetchTransacciones().catch(console.error);
  
      resetPaymentForm();
      setReferenciaPagoForm({
        DocumentoVE: "",
        IdCliente: selectedTransaccion.IdCliente,
        IdVendedor: vendor.IdVendedor,
        ValorPago: ""
      });
    } catch (error: any) {
      console.error("Error al procesar el pago:", error);
      alert(`Error: ${error.message || "No se pudo procesar el pago"}`);
    } finally {
      setIsSubmittingReferencia(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Transacciones', headerShown: false }} />
      
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, { color: themeText }]}>Transacciones</ThemedText>
        <Pressable style={styles.refreshButton} onPress={fetchTransacciones}>
          <Feather name="refresh-cw" size={20} color={themeAccent} />
        </Pressable>
      </ThemedView>

      {vendor && (
        <View style={[styles.infoBanner, { backgroundColor: themeBg2, borderColor: themeAccent }]}> 
          <Feather name="info" size={18} color={themeAccent} style={{ marginRight: 8 }} />
          { !vendor.IdRuta ? (
            <ThemedText style={{ color: themeText, flex: 1 }}>
              El vendedor no tiene una ruta asignada. Se mostrarán todas las transacciones con valor pendiente.
            </ThemedText>
          ) : (
            <ThemedText style={{ color: themeText, flex: 1 }}>
              Mostrando transacciones pendientes para la ruta: {rutasMap[vendor.IdRuta] || vendor.IdRuta}
            </ThemedText>
          ) }
        </View>
      )}

  

             
          
            {/* Modal para seleccionar cliente */}
            <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
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
                      value={clientSearchInput}  // Use the new state
                      onChangeText={setClientSearchInput}  // Update the new state
                      editable={!loadingClients}
                      style={[styles.searchInput, {
                        flex: 1,
                        height: '100%',
                        borderWidth: 0,
                        padding: 0,
                        margin: 0,
                        transform: Platform.OS != 'web' ? [{ translateY: 6 }] : [],
                      }]}
                      onSubmitEditing={() => handleClientSearch(clientSearchInput)}  // Pass the search term
                    />
                <Pressable 
                    onPress={() => handleClientSearch(clientSearchInput)}  // Pass the search term
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
                {loadingClients ? (
                  <ActivityIndicator color={themeAccent} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView
                    style={styles.clientList}
                    {...(Platform.OS === 'web' ? { className: 'custom-scrollbar' } : {})}
                    contentContainerStyle={{ paddingBottom: 12 }}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={themeAccent === '#fff' ? 'white' : 'black'}
                  >
                    {filteredClients.length === 0 ? (
                      <ThemedText style={{ color: themeText, textAlign: 'center', marginTop: 16 }}>No hay clientes.</ThemedText>
                    ) : (
                      filteredClients.slice(0, 20).map((cliente, idx) => (
                        <Pressable
                        key={cliente.IdCliente || cliente.id || idx}
                        style={[styles.clientItem, selectedClient && selectedClient.IdCliente === cliente.IdCliente ? { borderColor: themeAccent, borderWidth: 2 } : {}]}
                        onPress={() => {
                        setSelectedClient(cliente);
                        setModalVisible(false);
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
          
        

      {/* Barra de búsqueda dinámica solo ejecuta búsqueda con Enter o icono */}
<View
  style={{
    flexDirection: isNarrow ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
    width: '100%',
  }}
>
  {/* Filtros de tipo */}
  <View style={{ flexDirection: isNarrow ? 'row' : 'row', width: isNarrow ? '100%' : undefined, justifyContent: isNarrow ? 'center' : undefined, marginBottom: isNarrow ? 6 : 0 }}>
    <Pressable
      onPress={() => setFilterTipo('VE')}
      style={{ height: 40, width: 110, borderRadius: 8, backgroundColor: filterTipo === 'VE' ? themeAccent : themeBg2, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
      <ThemedText style={{ color: filterTipo === 'VE' ? '#fff' : themeText, fontWeight: 'bold' }}>Facturas</ThemedText>
    </Pressable>
    <Pressable
      onPress={() => setFilterTipo('IN')}
      style={{ height: 40, width: 110, borderRadius: 8, backgroundColor: filterTipo === 'IN' ? themeAccent : themeBg2, alignItems: 'center', justifyContent: 'center', marginRight: isNarrow ? 0 : 12 }}>
      <ThemedText style={{ color: filterTipo === 'IN' ? '#fff' : themeText, fontWeight: 'bold' }}>Ingresos</ThemedText>
    </Pressable>
  </View>

  {/* Buscar por cliente (abre modal de clientes) */}
  <View style={{ flexDirection: 'row', alignItems: 'center', width: isNarrow ? '80%' : 200, height: 40, backgroundColor: themeBg2, borderRadius: 8, borderWidth: 1, borderColor: themeAccent, marginBottom: isNarrow ? 6 : 0, paddingHorizontal: 8 }}>
  <Pressable
    onPress={() => setModalVisible(true)}
    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, height: '100%' }}
    disabled={!!selectedClient} // Deshabilitar si hay cliente seleccionado
  >
    <Feather name="users" size={20} color={themeAccent} style={{ marginRight: 8 }} />
    <ThemedText
      style={{
        color: themeText,
        fontWeight: 'bold',
        flex: 1,
        overflow: 'hidden',
        textAlignVertical: 'center',
      }}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {selectedClient ? selectedClient.NombreC : 'Buscar cliente...'}
    </ThemedText>
  </Pressable>
  {selectedClient && (
    <Pressable
      onPress={() => setSelectedClient(null)}
      style={{ marginLeft: 8, padding: 2, borderRadius: 16, backgroundColor: 'transparent', height: 28, width: 28, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel="Quitar cliente seleccionado"
    >
      <Feather name="x" size={18} color={themeAccent} />
    </Pressable>
  )}
</View>

  {/* Barra de búsqueda - Versión web */}
  {Platform.OS === 'web' ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: isNarrow ? '100%' : '80%',
        maxWidth: 600,
        minHeight: 40,
        marginBottom: isNarrow ? 6 : 0,
        paddingVertical: 0,
        paddingHorizontal: isNarrow ? 0 : 16,
        backgroundColor: 'transparent',
        marginTop: 18,
        flex: 1
      }}
    >
      <ThemedInput
        placeholder="Buscar transacción..."
        value={searchInput}
        onChangeText={setSearchInput}
        style={{
          flex: 1,
          minWidth: 200,
          height: 40,
          borderRadius: 8,
          marginRight: 8,
          backgroundColor: themeBg2,
          borderWidth: 0,
          borderColor: themeAccent,
          textAlignVertical: 'center',
          paddingVertical: 0,
          paddingHorizontal: 12,
          textAlign: 'left',
        }}
        editable={!loading}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        onSubmitEditing={() => setSearchQuery(searchInput)}
        returnKeyType="search"
      />
      <Pressable 
        onPress={() => setSearchQuery(searchInput)} 
        style={{ 
          height: 40, 
          width: 40, 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginRight: 4,
          borderRadius: 20,
          transform: [{translateY: -10}],
          backgroundColor: themeBg2
        }}
      >
        <Feather name="search" size={20} color={themeAccent} />
      </Pressable>
      {searchInput.length > 0 && (
        <Pressable 
          onPress={() => { setSearchInput(''); setSearchQuery(''); }} 
          style={{ 
            height: 40, 
            width: 40, 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 20,
            backgroundColor: themeBg2
          }}
        >
          <Feather name="x" size={20} color={themeAccent} />
        </Pressable>
      )}
    </View>
  ) : (
    /* Versión móvil */
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
      }}
    >
      <ThemedInput
        placeholder="Buscar transacción..."
        value={searchInput}
        onChangeText={setSearchInput}
        style={{
          flex: 1,
          height: 44,
          width: '100%',
          borderRadius: 22,
          paddingHorizontal: 16,
          backgroundColor: themeBg2,
          borderWidth: 0,
          borderColor: themeAccent,
          fontSize: 16,
        }}
        editable={!loading}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        onSubmitEditing={() => setSearchQuery(searchInput)}
        returnKeyType="search"
      />
      {searchInput.length > 0 && (
        <Pressable 
          onPress={() => { setSearchInput(''); setSearchQuery(''); }}
          style={{
            position: 'absolute',
            right: 20,
            top: 5,
            padding: 8,
          }}
        >
          <Feather name="x" size={20} color={themeAccent} />
        </Pressable>
      )}
    </View>
  )}
</View>

{loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeAccent} />
          <ThemedText style={styles.loadingText}>Cargando transacciones...</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {transacciones.length > 0 ? (
            <View style={styles.transaccionesContainer}>
              <View style={styles.transaccionesGrid}>
                {[...transacciones]
                  .filter((t) => {
                    if (filterTipo === 'VE' && selectedClient) {
                      return t.IdCliente === selectedClient.IdCliente && (t.Pendiente ?? 0) > 0;
                    }
                    if (filterTipo === 'IN') {
                      // No filtrar localmente por cliente, ya viene filtrado del backend
                      return true;
                    }
                    const query = searchQuery.trim().toLowerCase();
                    if (!query) return true;
                    const doc = (t.Documento || '').toLowerCase();
                    const cliente = (clientesMap?.[t.IdCliente]?.NombreC || '').toLowerCase();
                    const id = String(t.IdTransa);
                    return (
                      doc.includes(query) ||
                      cliente.includes(query) ||
                      id.includes(query)
                    );
                  })
                  .sort((a, b) => b.IdTransa - a.IdTransa)
                  .slice(0, 20)
                  .map((transaccion) => (
                <ThemedView 
                  key={transaccion.IdTransa} 
                  style={[
                    styles.transaccionCard, 
                    isMobile && (width < 600 ? styles.transaccionCardMobile : styles.transaccionCardNarrow),
                    { backgroundColor: themeBg2 }
                  ]}
                >
                  <View style={[styles.transaccionHeader, { borderBottomColor: themeTextSecondary + '20' }]}>
                    <View style={styles.transaccionInfo}>
                      <ThemedText style={[styles.transaccionId, { color: themeText }]}>
                        Transacción #{transaccion.IdTransa}
                      </ThemedText>
                      <ThemedText style={[styles.transaccionDate, { color: themeTextSecondary }]}>
                        {formatDateTime(transaccion.Fecha)}
                      </ThemedText>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: getTipoColor(transaccion.Tipo),
                        marginLeft: 8
                      }
                    ]}>
                      <ThemedText style={styles.statusBadgeText}>
                        {getTipoLabel(transaccion.Tipo)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.transaccionDetails}>
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary }]}>Documento</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: themeText }]}>
                        {transaccion.Documento || 'N/A'}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary }]}>Cliente</ThemedText>
                      <ThemedText 
                        style={[styles.detailValue, { 
                          color: themeText,
                          textAlign: 'right'
                        }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {clientesMap[transaccion.IdCliente]?.NombreC || 'Cargando...'}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary }]}>Vendedor</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: themeText }]}>
                        {vendedoresMap[transaccion.IdVendedor]?.NombreV || 'Cargando...'}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={[styles.detailLabel, { color: themeTextSecondary }]}>
                        {transaccion?.Pendiente !== undefined && transaccion?.Pendiente > 0 ? 'Pendiente' : 'Valor'}
                      </ThemedText>
                      <ThemedText style={[
                        styles.detailValue, 
                        { 
                          color: transaccion?.Pendiente !== undefined && transaccion?.Pendiente > 0 ? '#FF3B30' : '#34C759',
                          fontWeight: 'bold',
                          fontSize: 15
                        }
                      ]}>
                        {formatCurrency(transaccion?.Pendiente !== undefined && transaccion?.Pendiente > 0 ? transaccion?.Pendiente : transaccion?.Valor || 0)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.buttonContainer, { borderTopColor: themeTextSecondary + '20' }]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.viewButton, 
                        { 
                          backgroundColor: 'transparent',
                          borderColor: themeAccent,
                          opacity: pressed ? 0.7 : 1
                        }
                      ]}
                      onPress={() => handleViewDetails(transaccion)}
                    >
                      <Feather name="eye" size={16} color={themeAccent} />
                      <ThemedText style={[styles.viewButtonText, { color: themeAccent }]}>
                        Realizar Pago
                      </ThemedText>
                    </Pressable>
                  </View>
                  </ThemedView>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={48} color={themeTextSecondary} />
              <ThemedText style={[styles.emptyText, { color: themeTextSecondary }]}>No se encontraron transacciones.</ThemedText>
            </View>
          )}
        </ScrollView>
      )}

{selectedTransaccion && (
  <Modal
    visible={showDetailsModal}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setShowDetailsModal(false)}
  >
    <View style={[styles.modalOverlay, Platform.OS !== 'web'  && { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <ThemedView style={[
        styles.modalContent, 
        { 
          backgroundColor: themeBg2,
          // Remove conditional styling that might cause issues on Android
          ...(Platform.OS !== 'web'  ? {
            marginTop: StatusBar.currentHeight || 0,
            height: '90%', // Use fixed height instead of flex
            width: '95%',
          } : {
            maxHeight: '90%'
          })
        }
      ]}>
        {/* Header - Always visible */}
        <View style={styles.modalHeader}>
          <ThemedText style={[styles.modalTitle, { color: themeText }]}>
            Detalles de Transacción
          </ThemedText>
          <Pressable 
            onPress={() => { 
              setShowDetailsModal(false);
              fetchTransacciones(); 
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              padding: 8
            })}
          >
            <Feather name="x" size={24} color={themeText} />
          </Pressable>
        </View>

        {/* Content - Simplified structure for Android */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 32 // Extra padding at bottom
          }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          nestedScrollEnabled={true} // Important for Android
        >
          {/* Transaction Info Grid */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 12 }]}>
              <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Documento:</ThemedText>
              <ThemedText style={styles.infoValue}>{selectedTransaccion.Documento || 'N/A'}</ThemedText>
            </View>
            <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 12 }]}>
              <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Tipo:</ThemedText>
              <ThemedText style={[styles.infoValue, { color: getTipoColor(selectedTransaccion.Tipo) }]}>
                {getTipoLabel(selectedTransaccion.Tipo)}
              </ThemedText>
            </View>
            <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 12 }]}>
              <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Fecha:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {selectedTransaccion.Fecha ? formatDateTime(selectedTransaccion.Fecha) : 'N/A'}
              </ThemedText>
            </View>
            <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 12 }]}>
              <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Cliente:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {clientesMap[selectedTransaccion.IdCliente]?.NombreC || 'Desconocido'} ({selectedTransaccion.IdCliente})
              </ThemedText>
            </View>
            <View style={[styles.infoItem, Platform.OS !== 'web' && { width: '100%', marginBottom: 12 }]}>
              <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Vendedor:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {vendedoresMap[selectedTransaccion.IdVendedor]?.NombreV || 'Desconocido'} ({selectedTransaccion.IdVendedor})
              </ThemedText>
            </View>

            {(selectedTransaccion?.Tipo ?? 'IN') !== 'IN' && (
              <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 12 }]}>
                <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Pendiente:</ThemedText>
                <ThemedText 
                  style={[ 
                    styles.infoValue, 
                    { 
                      fontWeight: 'bold',
                      color: (selectedTransaccion.Pendiente ?? 0) > 0 ? '#ff3b30' : '#34c759'
                    }
                  ]}
                >
                  {formatCurrency(selectedTransaccion.Pendiente ?? 0)}
                </ThemedText>
              </View>
            )}
          </View>
          
          {/* Payment Button for VE transactions */}
          {(selectedTransaccion?.Tipo ?? 'IN') !== 'IN' && (selectedTransaccion?.Pendiente ?? 0) > 0 && (
            <Pressable
              style={[
                styles.viewButton, 
                { 
                  backgroundColor: 'green', 
                  alignSelf: 'center',
                  width: '80%',
                  marginTop: 16,
                  marginBottom: 24
                }
              ]}
              onPress={() => {
                setShowDetailsModal(false);
                setShowPaymentModal(true);
              }}
            >
              <Feather name="dollar-sign" size={16} color="#fff" />
              <ThemedText style={[styles.viewButtonText, { color: '#fff' }]}>
                Realizar Pago
              </ThemedText>
            </Pressable>
          )}
          
          {/* Payment Details for IN transactions */}
          {(selectedTransaccion?.Tipo ?? 'IN') === 'IN' && (
            <View style={{ width: '100%', marginTop: 24 }}>
                 <ThemedText style={[styles.infoValue, { marginTop: -12, color: themeAccent }]}>
                Concepto: {selectedTransaccion?.Concepto}
              </ThemedText>  
              <ThemedText style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Pago Asociado (TOTAL: {selectedTransaccion?.Valor ? formatCurrency(selectedTransaccion.Valor) : formatCurrency(0)})
              </ThemedText>
         
              <View style={[styles.infoGrid, Platform.OS !== 'web'  && { flexDirection: 'column' }]}>
                <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 8 }]}>
                  <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Efectivo:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {selectedTransaccion?.Efectivo ? formatCurrency(selectedTransaccion.Efectivo) : formatCurrency(0)}
                  </ThemedText>
                </View>
                
                <View style={[styles.infoItem, Platform.OS !== 'web'  && { width: '100%', marginBottom: 8 }]}>
                  <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Tarjeta:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {selectedTransaccion?.Tarjeta ? formatCurrency(selectedTransaccion.Tarjeta) : formatCurrency(0)}
                  </ThemedText>
                </View>
                
                <View style={[styles.infoItem, Platform.OS!== 'web' && { width: '100%', marginBottom: 8 }]}>
                  <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Transferencia:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {selectedTransaccion?.Transferencia ? formatCurrency(selectedTransaccion.Transferencia) : formatCurrency(0)}
                  </ThemedText>
                </View>
                
                <View style={[styles.infoItem, Platform.OS !== 'web' && { width: '100%', marginBottom: 8 }]}>
                  <ThemedText style={[styles.infoLabel, { color: themeTextSecondary }]}>Cheque:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {selectedTransaccion?.Cheque ? formatCurrency(selectedTransaccion.Cheque) : formatCurrency(0)}
                  </ThemedText>
                </View>

              </View>
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
                      {isGeneratingFactura ? 'Generando...' : 'Comprobante'}
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
                               selectedPaperSize === 'thermal' && { color: themeBg }
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
                               selectedPaperSize === 'letter' && { color: themeBg }
                             ]}>
                               Carta
                             </ThemedText>
                           </Pressable>
                         </View>
                       </View>
                       
                       <View style={styles.actionButtons}>
                         <Pressable 
                           style={[styles.actionButton, { backgroundColor: themeBg3 }]} 
                           onPress={() => handlePrintComprobante(selectedTransaccion.IdTransa, 'download', selectedPaperSize)}
                         >
                           <Feather name="download" size={16} color={themeText} />
                           <ThemedText style={[styles.actionButtonText, { color: themeText }]}>
                             Descargar
                           </ThemedText>
                         </Pressable>
                         <Pressable 
                           style={[styles.actionButton, { backgroundColor: themeBg3 }]} 
                           onPress={() => handlePrintComprobante(selectedTransaccion.IdTransa, 'print', selectedPaperSize)}
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
          )}
          {/* BUTTON*/}

          {/* Payment History for VE transactions */}
          {(selectedTransaccion?.Tipo ?? 'IN') !== 'IN' && (
            <View style={{ width: '100%', marginTop: 24 }}>
              <Pressable 
                onPress={() => setIsPaymentHistoryExpanded(!isPaymentHistoryExpanded)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  marginBottom: 12
                }}
              >
                <ThemedText style={[styles.sectionTitle, { marginBottom: 0, marginRight: 8 }]}> 
                  Historial de Pagos {paymentReferences.length > 0 ? `(${paymentReferences.length})` : ''}
                </ThemedText>
                <Feather 
                  name={isPaymentHistoryExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={themeText} 
                />
                {loadingReferences && (
                  <ActivityIndicator size="small" color={themeAccent} style={{ marginLeft: 8 }} />
                )}
              </Pressable>

              {isPaymentHistoryExpanded && paymentReferences.length > 0 && (
                <View style={{ 
                  borderWidth: 1, 
                  borderColor: themeTextSecondary, 
                  borderRadius: 8, 
                  overflow: 'hidden',
                  marginBottom: 16
                }}>
                  {paymentReferences.map((ref, index) => {
                    const formattedDate = ref.CreatedAt 
                      ? formatDateToDDMMYYYY(new Date(ref.CreatedAt))
                      : 'N/A';

                    return (
                      <View key={ref.IdReferencia} style={[
                        { 
                          backgroundColor: themeBg2,
                          padding: 12,
                          borderBottomWidth: index === paymentReferences.length - 1 ? 0 : 1,
                          borderBottomColor: themeTextSecondary + '20'
                        }
                      ]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <ThemedText style={{ fontSize: 12, color: themeTextSecondary }}>
                            #{index + 1} - {ref.DocumentoIN || 'N/A'}
                          </ThemedText>
                          <Pressable onPress={() => handleShowReferenciaDetail(ref)}>
                            <Feather name="eye" size={16} color={themeAccent} />
                          </Pressable>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <ThemedText style={{ fontSize: 14, color: themeText }}>
                            {formattedDate}
                          </ThemedText>
                          <ThemedText style={[{ 
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: (ref.ValorPago ?? 0) > 0 ? '#34c759' : themeText
                          }]}>
                            {formatCurrency(ref.ValorPago ?? 0)}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              
              {isPaymentHistoryExpanded && paymentReferences.length === 0 && !loadingReferences && (
                <ThemedText style={{ color: themeTextSecondary, textAlign: 'center', marginTop: 16 }}>
                  No hay referencias de pago registradas
                </ThemedText>
              )}
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </View>
  </Modal>
)}  
      {/* Modal de éxito al guardar pago */}
<Modal
  visible={showSuccessModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowSuccessModal(false)}
>
  <View style={[styles.modalOverlay]}> 
    <View style={[styles.modalContent, { backgroundColor: themeBg2, maxWidth: 400, width: '90%', padding: 12  }]}>  
      <Feather name="check-circle" size={48} color="#4CAF50" style={{ alignSelf: 'center', marginBottom: 12 }} />
      <ThemedText style={{ color: themeText, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
        ¡Pago guardado exitosamente!
      </ThemedText>
      <ThemedText style={{ fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
        Número de Documento IN:
      </ThemedText>
      <ThemedText style={{ fontSize: 28 , fontWeight: 'bold', color: themeAccent, textAlign: 'center', marginBottom: 24, ...(Platform.OS != 'web' ? { fontSize: 22 } : {})}}>
        {lastDocumentoIN}
      </ThemedText>
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton, 
            { 
              backgroundColor: pressed ? themeAccent : themeAccent,
              marginRight: 8
            }
          ]}
          onPress={async () => {
            if (!lastDocumentoIN) return;
          
            try {
              setIsGeneratingFactura(true);
          
              const response = await fetch(`${apiUrl}facturas/transaccion-in/${lastDocumentoIN}`);
              if (!response.ok) {
                throw new Error(`Error generando factura: ${response.status}`);
              }
          
              // 📱 Manejo en móviles (iOS / Android)
              if (Platform.OS !== 'web') {
                const blob = await response.blob();
                const reader = new FileReader();
          
                return new Promise<void>((resolve) => {
                  reader.onloadend = async () => {
                    try {
                      const base64data = reader.result as string;
                      const pdfData = base64data.split(',')[1];
                      const fileName = `FACT-${String(lastDocumentoIN).padStart(8, '0')}.pdf`;
                      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          
                      // Guardar PDF temporalmente
                      await FileSystem.writeAsStringAsync(fileUri, pdfData, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
          
                      // Compartir o imprimir
                      try {
                        await Print.printAsync({ uri: fileUri });
                      } catch (err: any) {
                        if (!(err instanceof Error && err.message === 'Printing cancelled')) {
                          throw err;
                        }
                      }
          
                      // Limpieza del archivo temporal
                      setTimeout(async () => {
                        try {
                          await FileSystem.deleteAsync(fileUri, { idempotent: true });
                        } catch (e) {
                          console.warn('Error deleting temp file:', e);
                        }
                      }, 60000);
          
                    } catch (err) {
                      console.error('Error handling PDF:', err);
                      alert('Error al procesar el archivo PDF.');
                    } finally {
                      setIsGeneratingFactura(false);
                      setShowPrintOptions(false);
                      resolve();
                    }
                  };
          
                  reader.readAsDataURL(blob);
                });
              }
          
              // 💻 Manejo en web (tu código original con iframe)
              const rawBlob = await response.blob();
              const blob = new Blob([rawBlob], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
          
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
                    printWindow.document.title = `FACT-${String(lastDocumentoIN).padStart(8, '0')}.pdf`;
                  } catch {}
                  printWindow.focus();
                  printWindow.print();
                  printWindow.addEventListener('afterprint', removeIframeAndRevoke);
                  setTimeout(removeIframeAndRevoke, 30000);
                } else {
                  setTimeout(removeIframeAndRevoke, 3000);
                }
              };
          
              iframe.onerror = () => {
                console.error('Failed to load PDF in iframe');
                window.open(url, '_blank');
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                window.URL.revokeObjectURL(url);
              };
          
            } catch (error) {
              console.error('Error generating factura:', error);
              alert('Error al generar la factura. Por favor, intente nuevamente.');
            } finally {
              setIsGeneratingFactura(false);
            }
          }}
          disabled={isGeneratingFactura}
        >
          {isGeneratingFactura ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
              Imprimir
            </ThemedText>
          )}
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.actionButton, 
            { 
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: themeAccent,
              marginLeft: 8
            }
          ]}
          onPress={async () => {
            if (!lastDocumentoIN) return;
          
            try {
              setIsGeneratingFactura(true);
              const response = await fetch(`${apiUrl}facturas/transaccion-in/${lastDocumentoIN}`);
              
              if (!response.ok) {
                throw new Error(`Error generando factura: ${response.status}`);
              }
          
              // 📱 Manejo en móviles
              if (Platform.OS !== 'web') {
                const blob = await response.blob();
                const reader = new FileReader();
          
                return new Promise<void>((resolve) => {
                  reader.onloadend = async () => {
                    try {
                      const base64data = reader.result as string;
                      const pdfData = base64data.split(',')[1];
                      const fileName = `RECIBO-${lastDocumentoIN}.pdf`;
                      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          
                      // Guardar PDF en caché
                      await FileSystem.writeAsStringAsync(fileUri, pdfData, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
          
                      // Compartir con visor del sistema
                      await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Recibo ${lastDocumentoIN}`,
                        UTI: 'com.adobe.pdf',
                      });
          
                      // Limpieza después de 1 minuto
                      setTimeout(async () => {
                        try {
                          await FileSystem.deleteAsync(fileUri, { idempotent: true });
                        } catch (e) {
                          console.warn('Error deleting temp file:', e);
                        }
                      }, 60000);
          
                    } catch (err) {
                      console.error('Error handling PDF:', err);
                      alert('Error al procesar el archivo PDF.');
                    } finally {
                      setIsGeneratingFactura(false);
                      resolve();
                    }
                  };
          
                  reader.readAsDataURL(blob);
                });
              }
          
              // 💻 Manejo en web (descarga directa con anchor)
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
          
              const a = document.createElement('a');
              a.href = url;
              a.download = `RECIBO-${lastDocumentoIN}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          
              setTimeout(() => window.URL.revokeObjectURL(url), 100);
          
            } catch (error) {
              console.error('Error generating factura:', error);
              alert('Error al generar la factura. Por favor, intente nuevamente.');
            } finally {
              setIsGeneratingFactura(false);
            }
          }}
          disabled={isGeneratingFactura}
          >
            {isGeneratingFactura ? (
              <ActivityIndicator color={themeAccent} size="small" />
            ) : (
            <ThemedText style={[styles.actionButtonText, { color: themeAccent }]}>
              Descargar
            </ThemedText>
          )}
        </Pressable>
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.closeButton, 
          { 
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: themeText,
            opacity: pressed ? 0.7 : 1
          }
        ]}
        onPress={() => {
          setShowSuccessModal(false);
          setShowDetailsModal(true);
        }}
      >
        <ThemedText style={[styles.closeButtonText, { color: themeText }]}>
          Cerrar
        </ThemedText>
      </Pressable>
    </View>
  </View>
</Modal>

      {/* Payment Modal */}
{/* Payment Modal */}
<Modal
  visible={showPaymentModal}
  animationType="slide"
  transparent={true}
  onRequestClose={handleClosePaymentModal}
>
  <View style={styles.modalOverlay}>
    <ThemedView style={[styles.modalContent, { backgroundColor: themeBg2 }]}>
      <View style={styles.modalHeader}>
        <ThemedText style={[styles.modalTitle, { color: themeText }]}>
          Transacción de Ingreso
        </ThemedText>
        <Pressable onPress={handleClosePaymentModal}>
          <Feather name="x" size={24} color={themeText} />
        </Pressable>
      </View>
      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <View style={{ position: "relative" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <ThemedText style={[styles.label, { color: themeText }]}>
                Fecha
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ThemedText
                  style={[
                    styles.input,
                    { borderColor: themeText, marginRight: 10 },
                  ]}
                >
                  {formatDisplayDate(date.format("YYYY-MM-DD"))}
                </ThemedText>
                <Pressable onPress={() => setShowDatePicker(true)}>
                  <Feather name="calendar" size={24} color={themeText} />
                </Pressable>
              </View>
            </View>
            {showDatePicker && (
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: themeBg,
                      borderRadius: 10,
                      padding: 20,
                      width: "90%",
                      maxWidth: 400,
                    }}
                  >
                    <DateTimePicker
                      mode="single"
                      date={date.toDate()} // 
                      onChange={(params) => {
                        if (params.date) {
                          setDate(dayjs(params.date)); // 
                          setShowDatePicker(false);
                        }
                      }}
                      styles={{
                        ...defaultStyles,
                        today: { borderColor: themeText },
                        selected: { backgroundColor: themeAccent },
                        selected_label: { color: themeText },
                      }}
                    />
                    <Pressable
                      onPress={() => setShowDatePicker(false)}
                      style={{
                        marginTop: 15,
                        padding: 10,
                        backgroundColor: themeAccent,
                        borderRadius: 5,
                        alignItems: "center",
                      }}
                    >
                      <ThemedText style={{ color: "#fff" }}>
                        Aceptar
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        </View>

              <View style={styles.formGroup}>
              <ThemedText style={[
                        styles.infoValue, 
                        { 
                          fontWeight: 'bold',
                          color: (selectedTransaccion?.Pendiente ?? 0) > 0 ? '#ff3b30' : '#34c759'
                        }
                      ]}>Valor Pendiente: {formatCurrency(selectedTransaccion?.Pendiente ?? 0)}</ThemedText>
                <ThemedText style={[styles.label, { color: themeText }]}>Tipo de Pago</ThemedText>
                {Object.entries(pagos).map(([tipo, monto]) => (
                  <View key={tipo} style={styles.paymentRow}>
                    <ThemedText style={[styles.paymentLabel, { color: themeText }]}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}:
                    </ThemedText>
                    <TextInput
                      style={[styles.paymentInput, { color: themeText, borderColor: themeText }]}
                      value={monto}
                      onChangeText={(value) => {
                        // Allow only numbers and at most one decimal point
                        let sanitized = value.replace(/[^0-9.]/g, '');
                        // Prevent more than one decimal point
                        const parts = sanitized.split('.');
                        if (parts.length > 2) {
                          sanitized = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setPagos(prev => ({
                          ...prev,
                          [tipo]: sanitized
                        }));
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: themeText }]}>Concepto</ThemedText>
                <TextInput
                  style={[
                    styles.textArea, 
                    { 
                      color: themeText, 
                      borderColor: themeText,
                      textAlignVertical: 'top'
                    }
                  ]}
                  value={concepto}
                  onChangeText={setConcepto}
                  multiline
                  numberOfLines={3}
                  placeholder="Ingrese el concepto del pago"
                />
              </View>

              <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: themeText }]}>Subtotal:</ThemedText>
                  <ThemedText style={[styles.totalValue, { color: themeText }]}>
                    {formatCurrency(subtotal)}
                  </ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: themeText }]}>
                    Impuesto ({configData?.Impuesto || '18'}%):
                  </ThemedText>
                  <ThemedText style={[styles.totalValue, { color: themeText }]}>
                    {formatCurrency(impuesto)}
                  </ThemedText>
                </View>
                <View style={[styles.totalRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: themeText + '40', paddingTop: 5 }]}>
                  <ThemedText style={[styles.totalLabel, { color: themeText, fontWeight: 'bold', fontSize: 18 }]}>
                    Total:
                  </ThemedText>
                  <ThemedText style={[styles.totalValue, { fontWeight: 'bold', fontSize: 18 }]}>
                    {formatCurrency(total)}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                style={[styles.submitButton, { 
                  backgroundColor: isPaymentValid && !isSubmittingReferencia ? '#007AFF' : '#999',
                  opacity: isSubmittingReferencia ? 0.7 : 1 
                }]}
                onPress={handleReferenciaPagoSubmit}
                disabled={!isPaymentValid || isSubmittingReferencia}
              >
                {isSubmittingReferencia ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    {isSubmittingReferencia ? 'Procesando...' : 'Guardar Pago'}
                  </ThemedText>
                )}
                {!isPaymentValid && selectedTransaccion?.Pendiente !== undefined && total > selectedTransaccion.Pendiente && (
                  <ThemedText style={[styles.errorText, { color: '#ff3b30', fontSize: 12, marginTop: 4 }]}>
                    El monto total no puede exceder el pendiente
                  </ThemedText>
                )}
                 {!isPaymentValid && (total <= 0) && (
                  <ThemedText style={[styles.errorText, { color: '#ff3b30', fontSize: 12, marginTop: 4 }]}>
                    El monto total debe ser mayor a 0
                  </ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

</ThemedView>
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
    ...(Platform.OS === 'web' && { left: 470 }),
    ...(Platform.OS !== 'web' && { left: 45, width: 300 }),
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
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  // Layout
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0,
        paddingHorizontal: 8,
        paddingBottom: 16,
      },
      default: {
        padding: 16,
      }
    })
  },
  modalContent: {
    width: '100%',
    borderRadius: 8,
    padding: 0, // Remove padding from container
    ...Platform.select({
      web: {
        maxWidth: 800,
        maxHeight: '90%',
        margin: 16,
      },
      android: {
        maxWidth: '100%',
        height: '90%', // Fixed height for Android
        marginHorizontal: 8,
      },
      ios: {
        maxWidth: 600,
        maxHeight: '90%',
        margin: 16,
      }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    minHeight: 56, // Ensure consistent header height
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },

  // Info Grid - Better Android support
  infoGrid: {
    width: '100%',
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
      },
      android: {
        flexDirection: 'column', // Stack vertically on Android
      },
      ios: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
      }
    })
  },

  infoItem: {
    marginBottom: 12,
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        flexBasis: '48%',
        width: '48%',
      },
      android: {
        width: '100%',
        flexBasis: 'auto',
      },
      ios: {
        flexBasis: '48%',
        width: '48%',
      }
    })
  },

  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    flexWrap: 'wrap', // Allow text wrapping
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Button styles - Better Android support
  viewButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44, // Ensure minimum touch target
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      }
    })
  },

  viewButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Reference table styles - Simplified for Android
  referenciaRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      android: {
        minHeight: 60, // Ensure adequate touch targets
      }
    })
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Form Elements
  formGroup: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    width: '100%',
    fontSize: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    marginRight: 8,
  },
  
  // Client List
  clientList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  clientItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderWidth: 0,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  
  // Transaction List
  scrollView: {
    flex: 1,
  },
  transaccionesContainer: {
    width: '100%',
    padding: 8,
  },
  transaccionesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  
  // Transaction Card
  transaccionCard: {
 
    ...(Platform.OS !== 'web' && { width: '80%' }),    
    ...(Platform.OS === 'web' && { width: '32%' }),    
    // Three cards per row on larger screens
    minWidth: 280, // Minimum width for each card
 // Ensure cards don't get too wide
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
    flexGrow: 1,
  },
  // For tablet view
  transaccionCardNarrow: {
    width: '48%', // Two cards per row on tablets
    maxWidth: '48%',
    minWidth: 0, // Allow cards to be smaller on tablets
    marginHorizontal: 0,
  },
  // For mobile view
  transaccionCardMobile: {
    width: '100%',
    maxWidth: '100%',
    marginHorizontal: 0,
  },
  transaccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    minHeight: 40, // Reduced height for compact look
  },
  transaccionInfo: {
    flex: 1,
  },
  transaccionId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transaccionDate: {
    fontSize: 11,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 70,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transaccionDetails: {
    marginTop: 12,
    flex: 1,
    minHeight: 120, // Ensure consistent height for details section
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginRight: 6,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  datePicker: {
    width: '100%',
    backgroundColor: 'white',
  },
  iosButtonContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  iosButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  iosButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Date picker styles are handled by the native component
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
    padding: 8,
    maxWidth: '100%',
    width: '100%',
    borderWidth: 1,
    borderRadius: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    maxWidth: '100%',
  },
  paymentLabel: {
    flex: 0.5,
    fontSize: 14,
    minWidth: 100,
  },
  paymentInput: {
    flex: 0.5,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    marginLeft: 8,
    textAlign: 'right',
    minHeight: 36,
    fontSize: 14,
    maxWidth: 150,
  },
  totalContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  // submitButton and submitButtonText styles are defined later in the file
  // to avoid duplicate property errors
 
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
  filtersContainer: {
    borderRadius: 12,
    padding: 16,
    margin: 16, 
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterScroller: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  filterSelect: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    marginLeft: 4,
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
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  detailsContainer: {
    width: '100%',
    padding: 8,
  },
  referenciasContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  referenciaHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  referenciaHeaderText: {
    fontWeight: '600',
    fontSize: 14,
  },
  referenciaItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  referenciaText: {
    fontSize: 14,
  },
  noReferenciasContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    elevation: 3,
    justifyContent: 'space-between', 
  },
  modalTwoColumnContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  modalLeftColumn: {
    flex: 1,
    paddingRight: 8,
  },
  modalRightColumn: {
    flex: 0.5,
    paddingLeft: 8,
  },
  formContainer: {
    padding: 12,
    borderRadius: 12,
    height: '100%',
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 16,
  },
  formField: {
    marginBottom: 4,
    width: '100%',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    paddingLeft: 12,
  },
  formInput: {
    borderWidth: 0,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    minHeight: 32,
    width: '100%',
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
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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
  itemCode: {
    fontSize: 12,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLabel: {
    fontSize: 12,
  },
  itemValue: {
    fontSize: 12,
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



});
