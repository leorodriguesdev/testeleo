import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { formatDate, formatTime } from '../../utils/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const EventosScreen = () => {
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedEvento, setSelectedEvento] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true);
      try {
        const id_usuario = await AsyncStorage.getItem('id');
        if (!id_usuario) {
          Alert.alert('Erro', 'Usuário não encontrado no AsyncStorage.');
          setIsLoading(false);
          return;
        }

        const response = await api.post('/evento.php', {
          id_usuario: 9571,
        });

        const { ok, msg } = response.data;
        if (!ok) {
          Alert.alert('STV', msg || 'Nenhum evento encontrado!');
        } else {
          setEventos(msg);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Erro ao buscar eventos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleOpenModal = (evento) => {
    setSelectedEvento(evento);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setSelectedEvento(null);
    setModalVisible(false);
  };

  const handleOpenLink = async (url) => {
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o link.');
    }
  };

  // Botão "Voltar" para a Home (ou a tela que desejar)
  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Header com background branco */}
        <View style={styles.customHeader}>
          {/* Botão de Voltar */}
          <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>

          {/* Ícone + Título Central */}
          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="calendar-check" size={30} color="#006f45" />
            <Text style={styles.headerText}>Seus Eventos</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#006f45"
            style={{ marginTop: 20 }}
          />
        ) : eventos.length > 0 ? (
          eventos.map((evento, index) => (
            <TouchableOpacity
              key={index}
              style={styles.eventosContainer}
              onPress={() => handleOpenModal(evento)}
            >
              <Text style={styles.eventosTitulo}>{evento.titulo}</Text>
              <View style={styles.eventosInfo}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="event" size={20} color="#006f45" />
                  <Text style={styles.infoText}>
                    {formatDate(evento.data)} - {formatTime(evento.hora)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="access-time" size={20} color="#006f45" />
                  <Text style={styles.infoText}>
                    Duração: {evento.duracao}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.remarcarButton}
                onPress={() => handleOpenModal(evento)}
              >
                <Text style={styles.remarcarButtonText}>Ver Detalhes</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.proximosContainer}>
            <Text style={styles.proximosTitulo}>Nenhum evento encontrado</Text>
          </View>
        )}

        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedEvento && (
                <>
                  <Text style={styles.modalTitle}>{selectedEvento.titulo}</Text>
                  <Text style={styles.modalText}>
                    Data: {formatDate(selectedEvento.data)}
                  </Text>
                  <Text style={styles.modalText}>
                    Hora: {formatTime(selectedEvento.hora)}
                  </Text>
                  <Text style={styles.modalText}>
                    Duração: {selectedEvento.duracao}
                  </Text>
                  <Text style={styles.modalText}>{selectedEvento.texto}</Text>

                  {selectedEvento.link &&
                    selectedEvento.link !== 'Não cadastrado' && (
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => handleOpenLink(selectedEvento.link)}
                      >
                        <Text style={styles.linkButtonText}>Abrir Link</Text>
                      </TouchableOpacity>
                    )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
};

export default EventosScreen;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header agora com background branco:
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 20, // Ajuste conforme necessário
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
    marginLeft: -30, // Para centralizar se precisar compensar o botão
  },
  headerText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
  },

  eventosContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  eventosTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  eventosInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 5,
    color: '#006f45',
    fontSize: 14,
  },
  remarcarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006f45',
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  remarcarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  proximosContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  proximosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
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
  closeButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
