import { LinkingOptions, getStateFromPath as getStateFromPathFn } from '@react-navigation/native';

/**
 * Configuration for deep linking in the app
 */
export const linking: LinkingOptions<any> = {
  prefixes: ['http://172.20.10.3:8081', 'passwordmanager://'],
  
  // Simple config that directly maps paths to screen names  
  config: {
    initialRouteName: 'Login',
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      
      // App tabs
      PasswordList: 'passwords',
      Profile: {
        screens: {
          ProfileMain: 'profile',
          Security: 'security',
          ForgotPassword: 'profile/change-password',
        }
      }
    }
  },
  
  getStateFromPath: (path, options) => {
    console.log('Deep linking path:', path);
    
    // Special handling for reset password URL
    if (path.includes('reset-password')) {
      const token = path.split('/').pop() || '';
      console.log('Reset password token:', token);
      
      if (token) {
        return {
          routes: [
            {
              name: 'ResetPassword',
              params: { token }
            }
          ]
        };
      }
    }
    
    // Default handling for other paths
    return getStateFromPathFn(path, options) || { routes: [] };
  }
};
