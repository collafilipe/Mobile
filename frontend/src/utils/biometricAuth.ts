import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'fingerprint' | 'facial' | 'iris';
export type AuthMethod = 'biometric' | 'facial' | 'device_passcode' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  warning?: string;
  authType?: BiometricType | 'device_passcode';
}

/**
 * Verifica se o dispositivo suporta autenticação biométrica
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
};

/**
 * Verifica se o dispositivo suporta autenticação por PIN/padrão
 */
export const isDevicePasscodeSet = async (): Promise<boolean> => {
  try {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
    return securityLevel !== LocalAuthentication.SecurityLevel.NONE;
  } catch (error) {
    console.error('Erro ao verificar PIN/padrão do dispositivo:', error);
    return false;
  }
};

/**
 * Verifica quais tipos de biometria estão disponíveis no dispositivo
 */
export const getBiometricTypes = async (): Promise<BiometricType[]> => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const biometricTypes: BiometricType[] = [];

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometricTypes.push('fingerprint');
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometricTypes.push('facial');
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    biometricTypes.push('iris');
  }

  return biometricTypes;
};

/**
 * Verifica se o usuário tem biometria cadastrada no dispositivo
 */
export const hasBiometricRecords = async (): Promise<boolean> => {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
};

/**
 * Verifica se o reconhecimento facial está disponível
 */
export const isFacialRecognitionAvailable = async (): Promise<boolean> => {
  const types = await getBiometricTypes();
  return types.includes('facial');
};

/**
 * Verifica se a impressão digital está disponível
 */
export const isFingerPrintAvailable = async (): Promise<boolean> => {
  const types = await getBiometricTypes();
  return types.includes('fingerprint');
};

/**
 * Realiza a autenticação com o método escolhido
 * @param method Método de autenticação (biometric, facial, device_passcode)
 * @param promptMessage Mensagem a ser exibida para o usuário
 * @param fallbackLabel Texto do botão alternativo (opcional)
 */
export const authenticateWithMethod = async (
  method: AuthMethod = 'biometric',
  promptMessage: string = 'Autentique para continuar',
  fallbackLabel: string = 'Usar senha'
): Promise<BiometricAuthResult> => {
  try {
    // Verificações iniciais
    const compatible = await isBiometricAvailable();
    const hasPasscode = await isDevicePasscodeSet();
    
    // Se o método for biometria ou facial, verificar se o dispositivo suporta
    if ((method === 'biometric' || method === 'facial') && !compatible) {
      return {
        success: false,
        error: `Este dispositivo não suporta autenticação ${method === 'facial' ? 'facial' : 'biométrica'}.`
      };
    }
    
    // Se o método for PIN/padrão, verificar se está configurado
    if (method === 'device_passcode' && !hasPasscode) {
      return {
        success: false,
        error: 'Nenhum PIN ou padrão configurado neste dispositivo.'
      };
    }
    
    // Se o método for biometria, verificar se há registros
    if (method === 'biometric') {
      const enrolled = await hasBiometricRecords();
      if (!enrolled) {
        return {
          success: false,
          error: 'Nenhuma biometria cadastrada neste dispositivo.'
        };
      }
    }
    
    // Se o método for facial, verificar se está disponível
    if (method === 'facial') {
      const hasFacial = await isFacialRecognitionAvailable();
      if (!hasFacial) {
        return {
          success: false,
          error: 'Este dispositivo não suporta reconhecimento facial.'
        };
      }
    }

    // Configurar opções de autenticação com base no método
    const options: LocalAuthentication.LocalAuthenticationOptions = {
      promptMessage,
      fallbackLabel,
      disableDeviceFallback: method !== 'device_passcode',
    };
    
    // Se o método for facial, tentar usar apenas reconhecimento facial
    if (method === 'facial') {
      options.requireConfirmation = false;
    }
    
    // Se o método for PIN/padrão, habilitar fallback para PIN/padrão
    if (method === 'device_passcode') {
      options.disableDeviceFallback = false;
    }

    // Realizar a autenticação
    const result = await LocalAuthentication.authenticateAsync(options);
    
    // Determinar o tipo de autenticação usado
    let authType: BiometricType | 'device_passcode' | undefined;
    if (result.success) {
      if (result.type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
        authType = 'fingerprint';
      } else if (result.type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        authType = 'facial';
      } else if (result.type === LocalAuthentication.AuthenticationType.IRIS) {
        authType = 'iris';
      } else {
        authType = 'device_passcode';
      }
    }

    return {
      success: result.success,
      warning: result.warning,
      error: result.error ? 'Falha na autenticação.' : undefined,
      authType
    };
  } catch (error) {
    return {
      success: false,
      error: 'Ocorreu um erro durante a autenticação.'
    };
  }
};

/**
 * Função legada para compatibilidade
 */
export const authenticateWithBiometrics = async (
  promptMessage: string = 'Autentique para continuar',
  fallbackLabel: string = 'Usar senha'
): Promise<BiometricAuthResult> => {
  return authenticateWithMethod('biometric', promptMessage, fallbackLabel);
}; 