// SettingsScreen.js

import React from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet } from 'react-native';

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>

      {/* Аватар */}
      <TouchableOpacity>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>Добавить Аватар</Text>
        </View>
      </TouchableOpacity>

      {/* Имя */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите имя"
        />
      </View>

      {/* Пароль */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите новый пароль"
          secureTextEntry
        />
      </View>

      {/* Кнопка сохранения */}
      <Button title="Сохранить настройки" onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginBottom: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
});

export default SettingsScreen;
