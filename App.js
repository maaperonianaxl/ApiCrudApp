import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';

const API_URL = 'https://dummyjson.com/products';

// Removes the "meta" field from a product object 
const stripMeta = ({ meta, ...rest }) => rest;

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(0);

  // POST states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [createdProduct, setCreatedProduct] = useState(null);

  // PATCH states
  const [updateId, setUpdateId] = useState('1');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updatedProduct, setUpdatedProduct] = useState(null);

  // DELETE states
  const [deleteId, setDeleteId] = useState('');
  const [deletedProduct, setDeletedProduct] = useState(null);

  // Clears the status text before every request
  const resetStatus = () => {
    setError('');
    setMessage('');
  };

  // GET: Retrieve products
  const getProducts = async () => {
    setLoading(true);
    resetStatus();

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to retrieve products.');
      }

      const data = await response.json();

      setProducts(data.products.map(stripMeta));
      setTotal(data.total);
      setSkip(data.skip);
      setLimit(data.limit);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // POST: Create a product
  const addProduct = async () => {
    if (!newTitle.trim() || !newPrice.trim()) {
      setError('Please enter a product title and price.');
      return;
    }

    const price = Number(newPrice);

    if (!Number.isFinite(price) || price < 0) {
      setError('Please enter a valid price.');
      return;
    }

    setLoading(true);
    resetStatus();
    setCreatedProduct(null);

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          price: price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product.');
      }

      const product = stripMeta(data);

      setCreatedProduct(product);
      // The API does not save it permanently, so add it to the displayed list locally
      setProducts((currentProducts) => [product, ...currentProducts]);
      setTotal((current) => current + 1);
      setMessage('Product created successfully!');
      setNewTitle('');
      setNewPrice('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // PATCH: Update selected product fields
  const updateProduct = async () => {
    if (!updateId.trim()) {
      setError('Please enter a product ID.');
      return;
    }

    const id = Number(updateId);

    if (!Number.isInteger(id) || id < 1) {
      setError('Please enter a valid product ID.');
      return;
    }

    if (!updateTitle.trim() && !updatePrice.trim()) {
      setError('Enter a new title or price.');
      return;
    }

    // Only send the fields that were filled in
    const changes = {};

    if (updateTitle.trim()) {
      changes.title = updateTitle.trim();
    }

    if (updatePrice.trim() !== '') {
      const price = Number(updatePrice);

      if (!Number.isFinite(price) || price < 0) {
        setError('Please enter a valid price.');
        return;
      }

      changes.price = price;
    }

    setLoading(true);
    resetStatus();
    setUpdatedProduct(null);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product.');
      }

      const product = stripMeta(data);

      setUpdatedProduct(product);
      setMessage('Product updated successfully! (simulated by the API)');
      setUpdateTitle('');
      setUpdatePrice('');

      // The API does not save changes, so update the displayed list locally
      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id ? { ...item, ...product } : item
        )
      );
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // DELETE: Remove a product
  const deleteProduct = async () => {
    if (!deleteId.trim()) {
      setError('Please enter a product ID.');
      return;
    }

    const id = Number(deleteId);

    if (!Number.isInteger(id) || id < 1) {
      setError('Please enter a valid product ID.');
      return;
    }

    setLoading(true);
    resetStatus();
    setDeletedProduct(null);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product.');
      }

      setDeletedProduct(stripMeta(data));

      // The API does not really delete it, so remove it from the displayed list locally
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );

      setTotal((current) => current - 1);
      setMessage(`Product ID ${id} deleted successfully! (simulated by the API)`);
      setDeleteId('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  // Shows every field of a product except "meta"
  const renderProduct = ({ item }) => {
    const product = stripMeta(item);

    return (
      <View style={styles.card}>
        <Text style={styles.productTitle}>
          {product.title || `Product ${product.id}`}
        </Text>

        {Object.entries(product).map(([key, value]) => {
          if (key === 'title') {
            return null;
          }

          return (
            <Text key={key} style={styles.detail}>
              {key}:{' '}
              {value !== null && typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </Text>
          );
        })}
      </View>
    );
  };

  // Shows the raw API response for POST / PATCH / DELETE
  const renderResult = (label, data) => (
    <View style={styles.resultCard}>
      <Text style={styles.productTitle}>{label}</Text>
      <Text style={styles.detail}>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Product API Manager</Text>

      {loading && <ActivityIndicator size="large" color="#2563eb" />}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {/* POST */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>POST - Create Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Product title"
          value={newTitle}
          onChangeText={setNewTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Product price"
          value={newPrice}
          onChangeText={setNewPrice}
          keyboardType="decimal-pad"
        />

        <Button title="Create Product" onPress={addProduct} disabled={loading} />

        {createdProduct && renderResult('POST API Response', createdProduct)}
      </View>

      {/* PATCH */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>PATCH - Update Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Product ID"
          value={updateId}
          onChangeText={setUpdateId}
          keyboardType="number-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="New title (optional)"
          value={updateTitle}
          onChangeText={setUpdateTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="New price (optional)"
          value={updatePrice}
          onChangeText={setUpdatePrice}
          keyboardType="decimal-pad"
        />

        <Button title="Update Product" onPress={updateProduct} disabled={loading} />

        {updatedProduct && renderResult('PATCH API Response', updatedProduct)}
      </View>

      {/* DELETE */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>DELETE - Remove Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter product ID"
          value={deleteId}
          onChangeText={setDeleteId}
          keyboardType="number-pad"
        />

        <Button
          title="Delete Product"
          onPress={deleteProduct}
          disabled={loading}
          color="#dc2626"
        />

        {deletedProduct && renderResult('DELETE API Response', deletedProduct)}
      </View>

      {/* GET */}
      <View style={styles.listHeader}>
        <Text style={styles.formTitle}>GET - Product List</Text>
        <Button title="Reload" onPress={getProducts} disabled={loading} />
      </View>

      <View style={[styles.card, styles.summaryCard]}>
        <Text style={styles.formTitle}>API Response Summary</Text>
        <Text style={styles.detail}>Total Products: {total}</Text>
        <Text style={styles.detail}>Skip: {skip}</Text>
        <Text style={styles.detail}>Limit: {limit}</Text>
      </View>

      {/* for listing products */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => `${item.id}-${index}`} 
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  contentContainer: {
    paddingTop: 45,
    paddingBottom: 30,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginBottom: 12,
    color: '#1e3a8a',
  },
  form: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  summaryCard: {
    marginHorizontal: 15,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  detail: {
    color: '#475569',
    marginTop: 3,
  },
  success: {
    color: '#15803d',
    marginHorizontal: 15,
    marginBottom: 8,
  },
  error: {
    color: '#dc2626',
    marginHorizontal: 15,
    marginBottom: 8,
  },
  resultCard: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 5,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 25,
  },
});