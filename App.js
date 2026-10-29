
import { useEffect, useState } from 'react';
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

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // POST states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [createdProduct, setCreatedProduct] = useState(null);

  // PATCH states
  const [updateId, setUpdateId] = useState('1');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updatedProduct, setUpdatedProduct] = useState(null);

  // DELETE state
  const [deleteId, setDeleteId] = useState('');

  // GET: Retrieve products
  const getProducts = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(API_URL); // fetching the products from the API

      if (!response.ok) {
        throw new Error('Failed to retrieve products.');
      }

      const data = await response.json();

      const cleanProducts = data.products.map( // removing the meta field from each product object
        ({ meta, ...product }) => product
      );

      setProducts(cleanProducts);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // POST: Create a product
  const addProduct = async () => {
    if (!newTitle.trim() || !newPrice.trim()) {
      setMessage('Please enter a product title and price.');
      return;
    }

    const price = Number(newPrice);

    if (!Number.isFinite(price) || price < 0) {
      setMessage('Please enter a valid price.');
      return;
    }
    
    // Set loading state and clear previous messages
    setLoading(true);
    setError('');
    setMessage('');
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

      const { meta, ...product } = data;

      setCreatedProduct(product);
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
      setMessage('Please enter a product ID.');
      return;
    }

    if (!updateTitle.trim() && !updatePrice.trim()) {
      setMessage('Enter a new title or price.');
      return;
    }

    const id = Number(updateId);

    if (!Number.isInteger(id) || id < 1) {
      setMessage('Please enter a valid product ID.');
      return;
    }

    if (updatePrice.trim() !== '') {
      const price = Number(updatePrice);

      if (!Number.isFinite(price) || price < 0) {
        setMessage('Please enter a valid price.');
        return;
      }
    }

    const changes = {};

    if (updateTitle.trim()) {
      changes.title = updateTitle.trim();
    }

    if (updatePrice.trim() !== '') {
      changes.price = Number(updatePrice);
    }

    setLoading(true);
    setError('');
    setMessage('');
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

      const { meta, ...product } = data;

      setUpdatedProduct(product);
      setMessage('Product updated successfully!');

      // Update the displayed list locally
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
      setMessage('Please enter a product ID.');
      return;
    }

  const id = Number(deleteId);

  if (!Number.isInteger(id) || id < 1) {
    setMessage('Please enter a valid product ID.');
    return;
  }

  setLoading(true);
  setError('');
  setMessage('');

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete product.');
    }

    // Remove the product from the displayed list
    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    );

    setMessage(`Product ID ${id} deleted successfully!`);
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

  const renderProduct = ({ item }) => {
  const { meta, ...product } = item;

  return (
    <View style={styles.card}>
      {Object.entries(product).map(([key, value]) => (
        <Text key={key} style={styles.detail}>
          {key}: {typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : String(value)}
        </Text>
      ))}
    </View>
  );
};

  // Main render
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

        <Button
          title="Create Product"
          onPress={addProduct}
          disabled={loading}
        />

        {createdProduct && (
          <View style={styles.resultCard}>
            <Text style={styles.productTitle}>{createdProduct.title}</Text>
            <Text>ID: {createdProduct.id}</Text>
            <Text>Price: ${createdProduct.price}</Text>
            <Text>API Response:</Text>
            <Text>{JSON.stringify(createdProduct, null, 2)}</Text>
          </View>
        )}
      </View>

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

        <Button
          title="Update Product"
          onPress={updateProduct}
          disabled={loading}
        />

        {updatedProduct && (
          <View style={styles.resultCard}>
            <Text style={styles.productTitle}>{updatedProduct.title}</Text>
            <Text>ID: {updatedProduct.id}</Text>
            <Text>Price: ${updatedProduct.price}</Text>
            <Text>API Response:</Text>
            <Text>{JSON.stringify(updatedProduct, null, 2)}</Text>
          </View>
        )}
      </View>

            {/* DELETE Form */}
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
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.formTitle}>Product List</Text>
        <Button
          title="GET - Reload"
          onPress={getProducts}
          disabled={loading}
        />
      </View>

      <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
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
    paddingTop: 45,
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
  productId: {
    color: '#64748b',
    fontSize: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  price: {
    color: '#15803d',
    fontSize: 19,
    fontWeight: 'bold',
    marginVertical: 4,
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
