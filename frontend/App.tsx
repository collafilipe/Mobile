import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Importando o provedor de autenticação e o navegador
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { linking } from './src/utils/linking';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
