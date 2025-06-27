import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductsAPI } from '@/lib/api/products';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import ThemedView from '@/components/ui/ThemedView';
import { Product } from '@/types/database';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import ProductForm from '@/components/sales/ProductForm';
import { generateId } from '@/lib/storage';

function AdminInventoryScreen() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productsData = await ProductsAPI.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Error cargando productos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique categories
  const categories = Array.from(
    new Set(products.map((product) => product.category))
  );

  // Filter products based on search query and selected category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = async (product: Product) => {
    try {
      if (editingProduct) {
        await ProductsAPI.updateProduct(editingProduct.id, {
          name: product.name,
          description: product.description,
          price: product.price,
          tax: product.tax,
          stock: product.stock,
          category: product.category,
        });
        
        const updatedProducts = products.map((p) =>
          p.id === product.id ? { ...product, updatedAt: new Date() } : p
        );
        setProducts(updatedProducts);
        showToast('Producto actualizado exitosamente', 'success');
      } else {
        const newProduct = await ProductsAPI.createProduct({
          id: generateId('prod_'),
          name: product.name,
          code: product.code,
          description: product.description,
          price: product.price,
          tax: product.tax,
          stock: product.stock,
          category: product.category,
        });
        
        setProducts([...products, newProduct]);
        showToast('Producto agregado exitosamente', 'success');
      }
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Error guardando producto', 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await ProductsAPI.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      showToast('Producto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Error eliminando producto', 'error');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: () => (
              <ThemedText variant="title">Gestión de Inventario</ThemedText>
            ),
            headerStyle: { backgroundColor: '#fff' },
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando productos...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <ThemedText variant="title">Gestión de Inventario</ThemedText>
          ),
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <Button
              title="Agregar"
              variant="primary"
              size="small"
              icon={<Ionicons name="add" size={16} color="white" />}
              onPress={() => {
                setEditingProduct(null);
                setShowAddForm(true);
              }}
            />
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar productos..."
        />
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryHeader}>
            <Ionicons name="filter-outline" size={16} color="#666" />
            <ThemedText style={styles.categoriesTitle}>Categorías:</ThemedText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === null && styles.activeCategory,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText
                style={[
                  styles.categoryText,
                  selectedCategory === null && styles.activeCategoryText,
                ]}
              >
                Todos
              </ThemedText>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.activeCategory,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <ThemedText
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.activeCategoryText,
                  ]}
                >
                  {category}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {showAddForm ? (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <ThemedText variant="subtitle">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </ThemedText>
            <Button
              title="Cancelar"
              variant="outline"
              size="small"
              onPress={() => {
                setShowAddForm(false);
                setEditingProduct(null);
              }}
            />
          </View>
          <ProductForm
            product={editingProduct || undefined}
            onSubmit={handleAddProduct}
            onCancel={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productMain}>
                  <ThemedText variant="subtitle">{item.name}</ThemedText>
                  <View style={styles.productMeta}>
                    <ThemedText variant="caption" style={styles.productCode}>
                      Código: {item.code}
                    </ThemedText>
                    {item.category && (
                      <View style={styles.categoryTag}>
                        <ThemedText style={styles.categoryTagText}>
                          {item.category}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <ThemedText
                  variant="subtitle"
                  color="#3498db"
                  style={styles.productPrice}
                >
                  ${item.price.toFixed(2)}
                </ThemedText>
              </View>

              {item.description && (
                <ThemedText style={styles.productDescription}>
                  {item.description}
                </ThemedText>
              )}

              <View style={styles.productFooter}>
                <View style={styles.productStock}>
                  <ThemedText variant="caption">
                    Stock: <ThemedText bold>{item.stock}</ThemedText>
                  </ThemedText>
                  <ThemedText variant="caption">
                    Impuesto: <ThemedText bold>{item.tax}%</ThemedText>
                  </ThemedText>
                </View>
                <View style={styles.productActions}>
                  <Button
                    title="Editar"
                    variant="outline"
                    size="small"
                    onPress={() => handleEditProduct(item)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Eliminar"
                    variant="danger"
                    size="small"
                    onPress={() => handleDeleteProduct(item.id)}
                  />
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <ThemedView centered style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color="#999" />
              <ThemedText variant="subtitle" centered style={styles.emptyText}>
                No hay productos que coincidan con tu búsqueda
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default function AdminInventoryScreenWithProviders() {
  return (
    <ToastProvider>
      <AdminInventoryScreen />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriesTitle: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategory: {
    backgroundColor: '#3498db',
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productMain: {
    flex: 1,
    marginRight: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  productCode: {
    marginRight: 8,
  },
  productPrice: {
    minWidth: 80,
    textAlign: 'right',
  },
  categoryTag: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#4a5568',
  },
  productDescription: {
    marginTop: 8,
    color: '#666',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  productStock: {
    flexDirection: 'row',
    gap: 12,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyContainer: {
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
});