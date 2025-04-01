export const generateStrongPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Garante que a senha tenha pelo menos um caractere de cada tipo
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Adiciona caracteres aleatórios até atingir o comprimento desejado
  const allChars = uppercase + lowercase + numbers + symbols;
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralha a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
}; 