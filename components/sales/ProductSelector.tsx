import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/firebase';
import { Surface, Portal, Modal, Text, Button, List, Searchbar, IconButton, Divider } from 'react-native-paper';
import ProductForm from './ProductForm';

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: Map<string, { product: Product; quantity: number }>;
  onSelectProduct: (product: Product, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onAddProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
}

export default function ProductSelector({
  products,
  selectedProducts,
  onSelectProduct,
  onUpdateQuantity,
  onAddProduct,
  onRemoveProduct,
}: ProductSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{
    product: Product;
    quantity: number;
  } | null>(null);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProduct = (product: Product) => {
    setEditingProduct({ product, quantity: 1 });
  };

  const handleConfirmAddProduct = () => {
    if (editingProduct) {
      onSelectProduct(editingProduct.product, editingProduct.quantity);
      setEditingProduct(null);
    }
  };

  const handleAddProduct = (product: Product) => {
    onAddProduct(product);
    setShowAddForm(false);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={1}>
        <View style={styles.header}>
          <Text variant="titleMedium">Productos</Text>
          <Button
            mode="contained"
            icon={() => <Ionicons name="add" size={18} color="white" />}
            onPress={() => setModalVisible(true)}
          >
            Agregar
          </Button>
        </View>

        {selectedProducts.size > 0 ? (
          <View style={styles.productsList}>
            {Array.from(selectedProducts.values()).map(({ product, quantity }) => (
              <Surface key={product.id} style={styles.productCard} elevation={1}>
                <List.Item
                  title={product.name}
                  description={product.code}
                  left={props => <List.Icon {...props} icon={() => <Ionicons name="cube-outline" size={24} color="#2196F3" />} />}
                />
                <Divider style={styles.divider} />
                <View style={styles.productDetails}>
                  <View style={styles.quantitySection}>
                    <Text variant="bodyMedium">Cantidad:</Text>
                    <View style={styles.quantityControls}>
                      <IconButton
                        icon={() => <Ionicons name="remove" size={20} color="#666" />}
                        mode="outlined"
                        onPress={() => {
                          if (quantity > 1) {
                            onUpdateQuantity(product.id, quantity - 1);
                          }
                        }}
                      />
                      <Text variant="titleMedium" style={styles.quantityText}>
                        {quantity}
                      </Text>
                      <IconButton
                        icon={() => <Ionicons name="add" size={20} color="#666" />}
                        mode="outlined"
                        onPress={() => onUpdateQuantity(product.id, quantity + 1)}
                      />
                    </View>
                  </View>
                  <View style={styles.priceSection}>
                    <Text variant="bodyMedium">
                      {quantity} x ${product.price.toFixed(2)}
                    </Text>
                    <Text variant="titleMedium" style={styles.totalPrice}>
                      ${(quantity * product.price).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditingProduct({ product, quantity });
                        setModalVisible(true);
                      }}
                      style={styles.actionButton}
                    >
                      Editar
                    </Button>
                    <Button
                      mode="contained-tonal"
                      onPress={() => onRemoveProduct(product.id)}
                      textColor="#e74c3c"
                      style={styles.actionButton}
                    >
                      Eliminar
                    </Button>
                  </View>
                </View>
              </Surface>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#666" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay productos seleccionados
            </Text>
          </View>
        )}
      </Surface>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setEditingProduct(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            {!showAddForm ? (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall">
                    {editingProduct ? 'Editar Producto' : 'Seleccionar Producto'}
                  </Text>
                  <Button onPress={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                  }}>
                    Cerrar
                  </Button>
                </View>

                {editingProduct ? (
                  <Surface style={styles.editQuantityCard} elevation={1}>
                    <Text variant="titleLarge">{editingProduct.product.name}</Text>
                    <Text variant="bodyMedium" style={styles.productCode}>
                      {editingProduct.product.code}
                    </Text>
                    
                    <View style={styles.priceRow}>
                      <Text variant="bodyLarge">Precio:</Text>
                      <Text variant="titleMedium">
                        ${editingProduct.product.price.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.quantitySection}>
                      <Text variant="bodyLarge">Cantidad:</Text>
                      <View style={styles.quantityControls}>
                        <IconButton
                          icon={() => <Ionicons name="remove" size={20} color="#666" />}
                          mode="outlined"
                          onPress={() => {
                            if (editingProduct.quantity > 1) {
                              setEditingProduct({
                                ...editingProduct,
                                quantity: editingProduct.quantity - 1,
                              });
                            }
                          }}
                        />
                        <Text variant="headlineSmall" style={styles.quantityText}>
                          {editingProduct.quantity}
                        </Text>
                        <IconButton
                          icon={() => <Ionicons name="add" size={20} color="#666" />}
                          mode="outlined"
                          onPress={() => {
                            setEditingProduct({
                              ...editingProduct,
                              quantity: editingProduct.quantity + 1,
                            });
                          }}
                        />
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.totalRow}>
                      <Text variant="titleLarge">Total:</Text>
                      <Text variant="headlineSmall" style={styles.totalAmount}>
                        ${(editingProduct.product.price * editingProduct.quantity).toFixed(2)}
                      </Text>
                    </View>
                    
                    <Button
                      mode="contained"
                      onPress={handleConfirmAddProduct}
                      style={styles.confirmButton}
                    >
                      {selectedProducts.has(editingProduct.product.id) ? "Actualizar" : "Agregar"}
                    </Button>
                  </Surface>
                ) : (
                  <>
                    <Searchbar
                      placeholder="Buscar producto..."
                      onChangeText={setSearchQuery}
                      value={searchQuery}
                      style={styles.searchBar}
                    />

                    <View style={styles.productsList}>
                      {filteredProducts.map((product) => (
                        <List.Item
                          key={product.id}
                          title={product.name}
                          description={`Código: ${product.code} • Stock: ${product.stock}`}
                          right={() => (
                            <Text variant="titleMedium" style={styles.price}>
                              ${product.price.toFixed(2)}
                            </Text>
                          )}
                          left={props => <List.Icon {...props} icon={() => <Ionicons name="cube-outline" size={24} color="#2196F3" />} />}
                          onPress={() => handleSelectProduct(product)}
                          style={styles.productItem}
                        />
                      ))}
                      {filteredProducts.length === 0 && (
                        <Text variant="bodyLarge" style={styles.emptyText}>
                          No hay productos que coincidan
                        </Text>
                      )}
                    </View>

                    <Button
                      mode="contained"
                      icon={() => <Ionicons name="add" size={18} color="white" />}
                      onPress={() => setShowAddForm(true)}
                      style={styles.addButton}
                    >
                      Nuevo Producto
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall">Nuevo Producto</Text>
                  <Button onPress={() => setShowAddForm(false)}>
                    Volver
                  </Button>
                </View>

                <ProductForm 
                  onSubmit={handleAddProduct} 
                  onCancel={() => setShowAddForm(false)} 
                />
              </>
            )}
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  productDetails: {
    padding: 16,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityText: {
    minWidth: 40,
    textAlign: 'center',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalPrice: {
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  productItem: {
    borderRadius: 8,
    marginBottom: 8,
  },
  price: {
    color: '#2196F3',
    marginRight: 8,
  },
  editQuantityCard: {
    padding: 16,
    borderRadius: 8,
  },
  productCode: {
    color: '#666',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalAmount: {
    color: '#2196F3',
  },
  confirmButton: {
    marginTop: 16,
  },
  addButton: {
    marginTop: 16,
  },
});