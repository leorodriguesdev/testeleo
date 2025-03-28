import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme'; 

import api from '../../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const [selectedBanner, setSelectedBanner] = useState(null);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const storedNome = await AsyncStorage.getItem('nome');
        setNome(storedNome || 'Usuário desconhecido');
      } catch (error) {
        console.error('Erro ao buscar o nome:', error);
        setNome('Usuário desconhecido');
      }
    };
    fetchName();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoadingBanners(true);
      const id_usuario = await AsyncStorage.getItem('id');
      try {
        const response = await api.post('banner.php', {
          id_usuario,
        });
        if (response.data.ok) {
          setBanners(response.data.msg);
        } else {
          console.log('Erro ao obter banners:', response.data.msg);
        }
      } catch (error) {
        console.error('Erro ao buscar banners:', error);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    let interval = null;
    if (banners.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 3000); // 3s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [banners]);

  useEffect(() => {
    if (scrollRef.current && banners.length > 1) {
      scrollRef.current.scrollTo({
        x: currentIndex * width,
        animated: true,
      });
    }
  }, [currentIndex, banners]);

  const onScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  const openCanalEtica = async () => {
    const url = 'https://www.stv.com.br/canaletica/';
    await Linking.openURL(url);
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientBackground}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://dedstudio.com.br/dev/STV/admin/img/logo.png' }}
            style={styles.logo}
          />
          <Text style={styles.welcomeText}>
            Olá, {nome}! Seja bem-vindo ao novo aplicativo da STV!
          </Text>
        </View>

        <View style={styles.sliderContainer}>
          {loadingBanners ? (
            <ActivityIndicator color="#006f45" size="large" />
          ) : (
            <>
              {banners.length > 0 ? (
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollEnd}
                  style={{ width }}
                >
                  {banners.map((banner, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.9}
                      onPress={() =>
                        setSelectedBanner(`https://dedstudio.com.br/dev/STV/${banner.img}`)
                      }
                    >
                      <Image
                        source={{
                          uri: `https://dedstudio.com.br/dev/STV/${banner.img}`,
                        }}
                        style={styles.sliderImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noBannerText}>
                  Nenhum banner disponível.
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Documentos')}
            >
              <FontAwesome name="file" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Documentos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Comunicacao')}
            >
              <MaterialIcons name="chat" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Comunicação</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Novidades')}
            >
              <MaterialIcons name="new-releases" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Novidades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Eventos')}
            >
              <MaterialIcons name="event" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Eventos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Pesquisas')}
            >
              <FontAwesome name="search" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Pesquisas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Biblioteca')}
            >
              <Entypo name="book" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Biblioteca</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={openCanalEtica}>
              <FontAwesome name="info-circle" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Canal de Ética</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('MeusDados')}
            >
              <FontAwesome name="user" size={24} color="#006f45" />
              <Text style={styles.buttonText}>Meus dados</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={!!selectedBanner}
          transparent={false}
          onRequestClose={() => setSelectedBanner(null)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            {/* Botão de fechar */}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedBanner(null)}
            >
              <Text style={styles.closeModalButtonText}>Fechar</Text>
            </TouchableOpacity>

            {selectedBanner && (
              <Image
                source={{ uri: selectedBanner }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',

    // Sombras
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 16,
    color: '#006f45',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sliderContainer: {
    marginTop: 20,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,

    width: '100%',
    height: 220,
  },
  sliderImage: {
    width: width,
    height: 220,
  },
  noBannerText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 60,
  },
  buttonsContainer: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FFFFFF',
    width: '49%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',

    // Sombras
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    marginTop: 10,
    color: '#006f45',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal de destaque do banner
  modalContainer: {
    flex: 1,
    backgroundColor: '#000', // fundo escuro para destacar a imagem
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 999, // garante que fique acima da imagem
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
