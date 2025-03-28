import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
} from 'react-native';
import api from '../../services/api';

// Importações para o gradiente
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { GRADIENT_COLORS } from '../../theme'; 
import { useNavigation } from '@react-navigation/native';

const TermosUso = () => {
  const [termos, setTermos] = useState('');
  const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
  
  useEffect(() => {
    const fetchTermos = async () => {
      setIsLoading(true);
      try {
        const response = await api.post('/regulamento.php');
        const { ok, msg } = response.data;

        if (!ok) {
          Alert.alert('Erro', msg || 'Nenhum regulamento encontrado!');
        } else {
          // Caso o back-end retorne um objeto com chave "texto"
          setTermos(msg.texto);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Erro ao carregar os termos de uso. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermos();
  }, []);

  const handleGoHome = () => {
    navigation.goBack();
  };


  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      style={styles.gradientContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.card}>
          <View style={styles.back}>
          <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>
          </View>

          <Image
            source={{ uri: 'https://dedstudio.com.br/dev/STV/admin/img/logo.png' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Política de Privacidade</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#006f45" />
          ) : (
            <Text style={styles.text}>
              {termos ? termos : 'Nenhum regulamento encontrado.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default TermosUso;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  // Conteúdo da ScrollView
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
  },
  back: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',

    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'justify',
    marginBottom: 15,
  },
});
