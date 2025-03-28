import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Se estiver usando gradiente como padrão do app
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme'; // Ajuste o caminho conforme seu projeto

import api from '../../services/api';
import Version from '../../utils/Version';

// Componente de Checkbox custom
const CustomCheckbox = ({ value, onValueChange, label }) => (
  <View style={styles.checkboxContainer}>
    <Checkbox
      style={styles.checkbox}
      value={value}
      onValueChange={onValueChange}
      color={value ? '#006f45' : undefined}
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </View>
);

const LoginScreen = () => {
  const navigation = useNavigation();

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitoPoliticas, setAceitoPoliticas] = useState(false);
  const [lembrarUsuario, setLembrarUsuario] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Carregar dados do AsyncStorage ao montar
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Carrega CPF e Senha salvos (se "lembrar usuário" foi usado)
        const storedCpf = await AsyncStorage.getItem('storedCpf');
        const storedSenha = await AsyncStorage.getItem('storedSenha');

        // Carrega se já aceitou políticas
        const storedPolicy = await AsyncStorage.getItem('acceptedPolicy');

        // Carrega flag de biometria
        const useBiometric = await AsyncStorage.getItem('useBiometric');

        // Preenche CPF se havia antes
        if (storedCpf) {
          setCpf(storedCpf);
          setLembrarUsuario(true);
        }
        // Se política aceita anteriormente, marca
        if (storedPolicy === 'true') {
          setAceitoPoliticas(true);
        }
        // Se biometria estiver habilitada
        if (useBiometric === 'true') {
          setBiometricEnabled(true);
          // Tenta login via biometria (autologin)
          await tryBiometricLogin();
        }
      } catch (error) {
        console.log('Erro ao carregar dados do AsyncStorage:', error);
      }
    };
    loadStoredData();
  }, []);

  // Tenta autenticar via biometria
  const tryBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;

      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua biometria para entrar',
      });
      if (biometricAuth.success) {
        // Carrega cpf e senha
        const storedCpf = await AsyncStorage.getItem('storedCpf');
        const storedSenha = await AsyncStorage.getItem('storedSenha');

        if (storedCpf && storedSenha) {
          // Chamamos handleLogin com override para evitar
          // o problema de estado não atualizado
          handleLogin({
            skipLoading: true,
            skipPolicyCheck: true,
            overrideCpf: storedCpf,
            overrideSenha: storedSenha,
          });
        }
      }
    } catch (error) {
      console.log('Erro biometria:', error);
    }
  };

  /**
   * Função principal de login
   * - skipLoading: não exibe ActivityIndicator
   * - skipPolicyCheck: não verifica se aceitou política
   * - overrideCpf / overrideSenha: usa esses valores no lugar do state, caso existam
   */
  const handleLogin = async ({
    skipLoading = false,
    skipPolicyCheck = false,
    overrideCpf = null,
    overrideSenha = null,
  } = {}) => {
    // Usa override se existir, senão usa o que está no state
    const finalCpf = overrideCpf ?? cpf;
    const finalSenha = overrideSenha ?? senha;

    // Valida
    if (!finalCpf || !finalSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Checa políticas, se aplicável
    if (!skipPolicyCheck && !aceitoPoliticas) {
      Alert.alert('Termos', 'É necessário aceitar as políticas de privacidade.');
      return;
    }

    if (!skipLoading) setIsLoading(true);

    console.log('Tentando login com:', {
      cpf: finalCpf,
      senha: finalSenha,
    });

    try {
      const response = await api.post('/login.php', {
        cpf: finalCpf,
        pass: finalSenha,
      });

      const { ok, msg } = response.data;

      console.log('Login response:', response.data);

      if (!ok) {
        Alert.alert('Erro', msg || 'CPF ou senha incorretos');
      } else {
        const userData = msg[0];
        if (
          userData.id_usuario &&
          userData.cpf &&
          userData.nome &&
          userData.cod_pessoa &&
          userData.empresa_id &&
          userData.matricula
        ) {
          // Salva dados do usuário
          await AsyncStorage.setItem('id', userData.id_usuario);
          await AsyncStorage.setItem('cpf', userData.cpf);
          await AsyncStorage.setItem('nome', userData.nome);
          await AsyncStorage.setItem('cod_pessoa', userData.cod_pessoa);
          await AsyncStorage.setItem('empresa_id', userData.empresa_id);
          await AsyncStorage.setItem('matricula', userData.matricula);

          // Se "lembrar usuário", salva CPF/Senha
          if (lembrarUsuario) {
            await AsyncStorage.setItem('storedCpf', finalCpf);
            await AsyncStorage.setItem('storedSenha', finalSenha);
          } else {
            // Remove se estiver salvo de antes
            await AsyncStorage.removeItem('storedCpf');
            await AsyncStorage.removeItem('storedSenha');
          }

          // Se aceita políticas, salva
          await AsyncStorage.setItem('acceptedPolicy', 'true');

          // Se suportar biometria e ainda não estiver habilitada, pergunta
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          if (hasHardware && !biometricEnabled) {
            Alert.alert(
              'Biometria',
              'Deseja usar biometria/Face ID nos próximos logins?',
              [
                { text: 'Não', style: 'cancel' },
                {
                  text: 'Sim',
                  onPress: async () => {
                    setBiometricEnabled(true);
                    await AsyncStorage.setItem('useBiometric', 'true');
                    // garante que a senha fique salva
                    await AsyncStorage.setItem('storedCpf', finalCpf);
                    await AsyncStorage.setItem('storedSenha', finalSenha);
                  },
                },
              ]
            );
          }

          // Navega para Home
          navigation.replace('Home');
        } else {
          Alert.alert('Erro', 'Erro ao processar os dados do usuário. Tente novamente.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao realizar login. Tente novamente.');
    } finally {
      if (!skipLoading) setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centerContent}
      >
        <View style={styles.card}>
          <Image
            source={{ uri: 'https://dedstudio.com.br/dev/STV/admin/img/logo.png' }}
            style={styles.logo}
          />
          <Text style={styles.subtitle}>SUA MAIOR SEGURANÇA.</Text>

          <TextInput
            style={styles.input}
            placeholder="CPF"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <CustomCheckbox
            value={aceitoPoliticas}
            onValueChange={setAceitoPoliticas}
            label={
              <Text>
                Concordo com as{' '}
                <Text style={styles.link}>Políticas de Privacidade</Text>
              </Text>
            }
          />
          <CustomCheckbox
            value={lembrarUsuario}
            onValueChange={setLembrarUsuario}
            label="Lembrar usuário"
          />

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#006f45"
              style={{ padding: 10 }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => handleLogin()}
              activeOpacity={0.8}
              disabled={!aceitoPoliticas}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={GRADIENT_COLORS}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Recupera')}
            activeOpacity={0.8}
          >
          <Text style={styles.esqueci}>Trocar Senha</Text>
          </TouchableOpacity>

          <Version home />
        </View>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

// Estilos
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',

    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#000',
    fontSize: 15,
  },
  link: {
    color: '#006f45',
    fontWeight: 'bold',
  },
  esqueci: {
    color: '#006f45',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginButton: {
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  version: {
    marginTop: 25,
    color: '#333',
    fontSize: 14,
  },
});
