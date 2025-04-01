import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/Login/LoginScreen';
import RegisterScreen from '../screens/Login/RegisterScreen';
import PasswordListScreen from '../screens/PasswordList/PasswordListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SecurityScreen from '../screens/Security/SecurityScreen';
import ForgotPasswordScreen from '../screens/Login/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Login/ResetPasswordScreen';
import ForgotPasswordProfileScreen from '../screens/Login/ForgotPasswordProfile';

import { useAuth } from '../context/AuthContext'; // está certo!

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ForgotPasswordProfile: undefined;
  ResetPassword: { token: string } | undefined;
};

type AppTabsParamList = {
  PasswordList: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Security: undefined;
  ForgotPassword: undefined;
  ForgotPasswordProfile: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabsParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <AuthStack.Screen name='ForgotPasswordProfile' component={ForgotPasswordProfileScreen} />
  </AuthStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ 
        headerShown: false,
        title: ''
      }}
    />
    <ProfileStack.Screen 
      name="Security" 
      component={SecurityScreen}
      options={{ 
        title: 'Segurança',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
      }}
    />
    <ProfileStack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordProfileScreen}
      options={{ 
        title: 'Alterar Senha',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
      }}
    />
  </ProfileStack.Navigator>
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
      component={ProfileNavigator}
      options={{ title: 'Perfil' }}
    />
  </AppTabs.Navigator>
);

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Return the navigator without the NavigationContainer
  return user ? <AppTabsNavigator /> : <AuthNavigator />;
};

export default AppNavigator;
