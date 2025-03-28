import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';

// Importações para o gradiente
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme'; // Ajuste o caminho conforme seu projeto

const Pesquisas = () => {
  const [pesquisas, setPesquisas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPesquisa, setSelectedPesquisa] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [perguntas, setPerguntas] = useState([]);
    const navigation = useNavigation();
  

  // Ao montar, busca as pesquisas
  useEffect(() => {
    const fetchPesquisas = async () => {
      setIsLoading(true);
      try {
        const id_usuario = await AsyncStorage.getItem('id');
        if (!id_usuario) {
          Alert.alert('Erro', 'Usuário não encontrado.');
          setIsLoading(false);
          return;
        }

        // Faz requisição para buscar lista de pesquisas
        const response = await api.post('/pesquisa.php', {
          id_usuario: id_usuario,
        });

        const { ok, msg } = response.data;
        console.log('Lista de pesquisas:', response.data); // Log para debug

        if (!ok) {
          Alert.alert('STV', msg || 'Nenhuma pesquisa encontrada!');
        } else {
          setPesquisas(msg);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Erro ao buscar pesquisas. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPesquisas();
  }, []);

  // Função chamada ao clicar em uma pesquisa
  const openModal = async (id_pesquisa) => {
    console.log('Abrindo modal para id_pesquisa:', id_pesquisa);
    setIsModalVisible(true);
    setSelectedPesquisa(null);
    setPerguntas([]);

    try {
      // Faz a requisição para buscar perguntas
      const response = await api.post('/pesquisa_pergunta.php', {
        id_pesquisa: id_pesquisa,
      });

      const { ok, msg } = response.data;
      console.log('Detalhes da pesquisa:', response.data); // Log para debug

      if (!ok || !msg || msg.length === 0) {
        console.log('STV','Nenhuma pergunta encontrada!');
      } else {
        setPerguntas(msg);
        setSelectedPesquisa(id_pesquisa);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao buscar perguntas da pesquisa. Tente novamente.');
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setPerguntas([]);
  };

  // Renderiza cada item da lista de pesquisas
  const renderPesquisaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pesquisaItem}
      onPress={() => openModal(item.id_pesquisa)}
    >
      <FontAwesome5 name="question-circle" size={24} color="#006f45" />
      <Text style={styles.pesquisaText}>{item.titulo}</Text>
    </TouchableOpacity>
  );

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
            <FontAwesome5 name="search" size={28} color="#006f45" />
            <Text style={styles.headerText}>Seus Pesquisas</Text>
            </View>
          </View>

        {/* Conteúdo principal */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#006f45"
            style={{ marginTop: 20 }}
          />
        ) : pesquisas.length > 0 ? (
          <FlatList
            data={pesquisas}
            renderItem={renderPesquisaItem}
            keyExtractor={(item) => item.id_pesquisa.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.card}>
            <FontAwesome5 name="question-circle" size={36} color="#006f45" />
            <Text style={styles.text}>Você não possui pesquisas</Text>
          </View>
        )}

        {/* Modal para exibir as perguntas da pesquisa */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Perguntas da Pesquisa {selectedPesquisa || ''}
              </Text>
              {perguntas.length > 0 ? (
                <FlatList
                  data={perguntas}
                  renderItem={({ item }) => (
                    <View style={styles.perguntaItem}>
                      <Text style={styles.perguntaText}>{item.enunciado}</Text>
                    </View>
                  )}
                  keyExtractor={(item) => item.id_pergunta.toString()}
                />
              ) : (
                <Text style={styles.noQuestionsText}>
                  Nenhuma pergunta encontrada.
                </Text>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
};

export default Pesquisas;

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
    paddingTop: 40, // Ajuste conforme necessário
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10, // Se quiser canto arredondado
    borderBottomRightRadius: 10,
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

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  text: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  pesquisaItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pesquisaText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  perguntaItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  perguntaText: {
    fontSize: 16,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#006f45',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
