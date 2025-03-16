import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView'; // Темная/светлая тема компонента
import { ThemedText } from '@/components/ThemedText'; // Текст с темной/светлой темой

export default function PaymentsScreen() {
  const [isCardAdded, setIsCardAdded] = useState(false);

  const handleAddCard = () => {
    // Здесь можно реализовать логику для добавления карты, например, через API или компонент.
    setIsCardAdded(true);
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>
      {isCardAdded ? (
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Your Credit Card</Text>
          {/* Здесь можно добавить картинку вашей кредитной карты */}
          <Image 
            source={require('@/assets/images/orange-card.png')} // Путь к изображению карты
            style={styles.cardImage} 
          />
        </View>
      ) : (
        <View style={styles.addCardContainer}>
          <Text style={styles.text}>No card added yet.</Text>
          <Button title="Add Card" onPress={handleAddCard} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addCardContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardImage: {
    width: 300,
    height: 180,
    resizeMode: 'contain',
  },
});
