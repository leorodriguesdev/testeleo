import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Linking
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

// Gradiente
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';

// BIBLIOTECA DE ZOOM
import ImageViewer from 'react-native-image-zoom-viewer';

const NovidadesScreen = () => {
  const [novidades, setNovidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de detalhes
  const [selectedNovidade, setSelectedNovidade] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Modal para imagem em tela cheia (com pinch-to-zoom)
  const [selectedImageForZoom, setSelectedImageForZoom] = useState(null);
  const [fullImageVisible, setFullImageVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchNovidades = async () => {
      setIsLoading(true);
      try {
        const id_usuario = await AsyncStorage.getItem('id');
        if (!id_usuario) {
          Alert.alert('Erro', 'Usuário não encontrado.');
          setIsLoading(false);
          return;
        }

        const response = await api.post('/novidade.php', {
          id_usuario: id_usuario,
        });

        const { ok, msg } = response.data;
        if (!ok) {
          Alert.alert('Erro', msg || 'Nenhuma novidade encontrada!');
        } else {
          setNovidades(msg);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Erro ao buscar novidades. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNovidades();
  }, []);

  // Abre modal de detalhes
  const openDetailModal = (novidade) => {
    setSelectedNovidade(novidade);
    setModalVisible(true);
  };

  // Fecha modal de detalhes
  const closeModal = () => {
    setSelectedNovidade(null);
    setModalVisible(false);
  };

  // Abre link no navegador
  const handleOpenLink = (link) => {
    if (link && link !== 'Não cadastrado' && link !== 'https://') {
      Linking.openURL(link).catch((err) => {
        Alert.alert('Erro', 'Não foi possível abrir o link.');
        console.error(err);
      });
    } else {
      Alert.alert('Aviso', 'Não há link válido cadastrado para esta novidade.');
    }
  };

  // Botão de voltar
  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  // Abre modal de imagem com pinch-to-zoom
  const openFullImage = (imgUri) => {
    setSelectedImageForZoom(imgUri);
    setFullImageVisible(true);
  };

  // Fecha modal de imagem
  const closeFullImage = () => {
    setSelectedImageForZoom(null);
    setFullImageVisible(false);
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Cabeçalho branco */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="exclamation-circle" size={36} color="#006f45" />
            <Text style={styles.headerText}>Suas Novidades</Text>
          </View>
        </View>

        {/* Lista de novidades */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#006f45" style={{ marginTop: 20 }} />
        ) : novidades.length > 0 ? (
          novidades.map((novidade, index) => (
            <TouchableOpacity
              key={index}
              style={styles.novidadeContainer}
              onPress={() => openDetailModal(novidade)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: `https://dedstudio.com.br/dev/STV/${novidade.img}` }}
                style={styles.image}
              />
              <Text style={styles.novidadeTitulo}>{novidade.titulo}</Text>
              <Text style={styles.novidadeTexto} numberOfLines={2} ellipsizeMode="tail">
                {novidade.texto}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noNovidadesContainer}>
            <Text style={styles.noNovidadesText}>Nenhuma novidade encontrada</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNovidade && (
              <>
                <Image
                  source={{ uri: `https://dedstudio.com.br/dev/STV/${selectedNovidade.img}` }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedNovidade.titulo}</Text>

                <ScrollView style={{ maxHeight: 200, marginBottom: 10 }}>
                  <Text style={styles.modalText}>{selectedNovidade.texto}</Text>
                </ScrollView>

                {selectedNovidade.link && selectedNovidade.link !== 'Não cadastrado' && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleOpenLink(selectedNovidade.link)}
                  >
                    <Text style={styles.linkButtonText}>Abrir Link</Text>
                  </TouchableOpacity>
                )}

                {/* Botão para ampliar a imagem (pinch-to-zoom) */}
                <TouchableOpacity
                  style={styles.ampliarButton}
                  onPress={() =>
                    openFullImage(`https://dedstudio.com.br/dev/STV/${selectedNovidade.img}`)
                  }
                >
                  <Text style={styles.ampliarButtonText}>Ampliar Imagem</Text>
                </TouchableOpacity>

                {/* Fechar Modal de detalhes */}
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de IMAGEM c/ pinch-to-zoom */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        onRequestClose={closeFullImage}
      >
        <ImageViewer
          imageUrls={[{ url: selectedImageForZoom }]}
          onCancel={closeFullImage}     // iOS: botar 2-finger swipe down, Android: back button
          enableSwipeDown               // swipe down pra fechar
          onSwipeDown={closeFullImage}
          backgroundColor="rgba(0, 0, 0, 0.9)"
        />
      </Modal>
    </LinearGradient>
  );
};

export default NovidadesScreen;

// Estilos
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -30,
  },
  headerText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  novidadeContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  novidadeTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  novidadeTexto: {
    fontSize: 14,
    color: '#666',
  },
  noNovidadesContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  noNovidadesText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'justify',
  },
  linkButton: {
    backgroundColor: '#006f45',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ampliarButton: {
    backgroundColor: '#006f45',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  ampliarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
