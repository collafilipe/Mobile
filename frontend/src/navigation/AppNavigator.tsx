import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/Login/LoginScreen';
import RegisterScreen from '../screens/Login/RegisterScreen';
import PasswordListScreen from '../screens/PasswordList/PasswordListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

import { useAuth } from '../context/AuthContext'; // está certo!

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type AppTabsParamList = {
  PasswordList: undefined;
  Profile: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabsParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const AppTabsNavigator = () => (
  <AppTabs.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

        if (route.name === 'PasswordList') {
          iconName = focused ? 'key' : 'key-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4285F4',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
      tabBarStyle: {
        elevation: 0,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: '#fff',
      },
    })}
  >
    <AppTabs.Screen
      name="PasswordList"
      component={PasswordListScreen}
      options={{ title: 'Senhas' }}
    />
    <AppTabs.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Perfil' }}
    />
  </AppTabs.Navigator>
);

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Pode retornar uma tela de loading
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <AppTabsNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
