import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Product } from '@/types/database';
import { generateId } from '@/lib/storage';

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      code: '',
      description: '',
      price: 0,
      tax: 18,
      stock: 0,
      category: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'El precio debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Generate a unique ID for new products
      const newProduct: Product = {
        id: product?.id || generateId('product_'),
        code: formData.code || '',
        name: formData.name || '',
        description: formData.description || '',
        price: Number(formData.price) || 0,
        tax: Number(formData.tax) || 18,
        stock: Number(formData.stock) || 0,
        category: formData.category || '',
        createdAt: product?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      onSubmit(newProduct);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Nombre"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        error={errors.name}
        autoCapitalize="words"
      />

      <Input
        label="Descripción"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
        numberOfLines={3}
      />

      <Input
        label="Precio"
        value={formData.price?.toString()}
        onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
        keyboardType="numeric"
        error={errors.price}
      />

      <Input
        label="Impuesto (%)"
        value={formData.tax?.toString()}
        onChangeText={(text) => setFormData({ ...formData, tax: parseFloat(text) || 0 })}
        keyboardType="numeric"
      />

      <Input
        label="Stock"
        value={formData.stock?.toString()}
        onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || 0 })}
        keyboardType="number-pad"
      />

      <Input
        label="Categoría"
        value={formData.category}
        onChangeText={(text) => setFormData({ ...formData, category: text })}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelButton}
        />
        <Button
          title={product ? 'Actualizar' : 'Guardar'}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    marginRight: 12,
  },
});