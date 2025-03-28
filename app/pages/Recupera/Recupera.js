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
import { useNavigation } from '@react-navigation/native';

import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme'; // Ajuste o caminho conforme seu projeto

import api from '../../services/api';
import Version from '../../utils/Version';


const LoginScreen = () => {
  const navigation = useNavigation();

  const [cpf, setCpf] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleRecupera = async ({
    skipLoading = false,
    overrideCpf = null,
  } = {}) => {
    // Usa override se existir, senão usa o que está no state
    const finalCpf = overrideCpf ?? cpf;

    // Valida
    if (!finalCpf) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }


    if (!skipLoading) setIsLoading(true);

    try {
      const response = await api.post('/recuperarsenha.php', {
        cpf: finalCpf,
      });

      const data = response.data;

      if (!data) {
        Alert.alert('Erro', data.msg || 'CPF incorreto');
      } else {
        if (data.success) {
          Alert.alert(
            'Sucesso',
            'Instruções enviada para o e-mail cadastrado.'
          );
          setTimeout(() => {
            navigation.goBack();
          }, 5000);

        } else {
          Alert.alert(
            'Erro',
            data.msg
          );
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao recuperar senha. Tente novamente.');
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
          <Text style={styles.subtitle}>Trocar Senha</Text>

          <Text>Enviaremos instruções via e-mail para</Text>
          <Text>trocar sua senha:</Text>

          <TextInput
            style={styles.input}
            placeholder="CPF"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#006f45"
              style={{ padding: 10 }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => handleRecupera()}
              activeOpacity={0.8}
              disabled={!cpf}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={GRADIENT_COLORS}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Trocar senha</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.esqueci}>Voltar</Text>
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
    marginTop: 12,
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
