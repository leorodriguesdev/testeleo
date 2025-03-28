import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';

import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';

const BibliotecaScreen = () => {
  // Lista de unidades
  const [unidades, setUnidades] = useState([]);
  // Unidade selecionada
  const [selectedUnidade, setSelectedUnidade] = useState(null);

  // Lista principal de livros
  const [livros, setLivros] = useState([]);

  // Loading states
  const [isLoadingUnidades, setIsLoadingUnidades] = useState(false);
  const [isLoadingLivros, setIsLoadingLivros] = useState(false);

  // Modal
  const [selectedLivro, setSelectedLivro] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Campo de pesquisa (local)
  const [searchTerm, setSearchTerm] = useState('');

  const navigation = useNavigation();

  // 1) Ao montar, buscar TODOS os livros (sem unidade)
  useEffect(() => {
    fetchUnidades();
    fetchLivrosAll(); // Já traz todos
  }, []);

  // =================== FUNÇÕES DE BUSCA ===================
  // Buscar unidades
  const fetchUnidades = async () => {
    setIsLoadingUnidades(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      if (!id_usuario) {
        Alert.alert('Erro', 'id_usuario não encontrado.');
        setIsLoadingUnidades(false);
        return;
      }

      const response = await api.post('/unidade.php', { id_usuario });
      const { ok, msg } = response.data;
      if (!ok) {
        Alert.alert('STV', 'Erro ao buscar unidades.');
      } else {
        setUnidades(msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível buscar unidades.');
    } finally {
      setIsLoadingUnidades(false);
    }
  };

  // Buscar TODOS os livros (sem unidade)
  const fetchLivrosAll = async () => {
    setIsLoadingLivros(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      if (!id_usuario) {
        Alert.alert('Erro', 'id_usuario não encontrado.');
        setIsLoadingLivros(false);
        return;
      }

      // unidade_id: null => back-end retorna todos
      const response = await api.post('/biblioteca.php', {
        id_usuario,
        unidade_id: null,
      });

      const { ok, msg } = response.data;
      if (!ok) {
        Alert.alert('STV', 'Nenhum livro encontrado.');
        setLivros([]);
      } else {
        setLivros(msg); // todos
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível buscar livros.');
    } finally {
      setIsLoadingLivros(false);
    }
  };

  // Buscar livros de UMA unidade
  const fetchLivrosByUnit = async (unidadeId) => {
    setIsLoadingLivros(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      if (!id_usuario) {
        Alert.alert('Erro', 'id_usuario não encontrado.');
        setIsLoadingLivros(false);
        return;
      }

      // Buscar só dessa unidade
      const response = await api.post('/biblioteca.php', {
        id_usuario,
        unidade_id: unidadeId,
      });

      const { ok, msg } = response.data;
      if (!ok) {
        Alert.alert('STV', 'Nenhum livro encontrado nesta unidade.');
        setLivros([]);
      } else {
        setLivros(msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível buscar livros.');
    } finally {
      setIsLoadingLivros(false);
    }
  };

  // =================== HANDLERS ===================
  // Quando o usuário escolhe unidade
  const handleUnidadeChange = (unidadeId) => {
    setSelectedUnidade(unidadeId);
    if (!unidadeId) {
      // Se desmarcou (null), volta a buscar todos
      fetchLivrosAll();
    } else {
      // Senão busca especificamente
      fetchLivrosByUnit(unidadeId);
    }
  };

  const openModal = (livro) => {
    setSelectedLivro(livro);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedLivro(null);
    setModalVisible(false);
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  // =================== FILTRAGEM LOCAL ===================
  // Sempre que 'livros' ou 'searchTerm' mudar, calculamos a lista filtrada
  const getFilteredLivros = () => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return livros; // Sem texto => retorna todos
    }

    return livros.filter((livro) => {
      const titulo = (livro.livro_titulo || '').toLowerCase();
      const autor = (livro.livro_autor || '').toLowerCase();
      const acao = (livro.livro_acao || '').toLowerCase();
      return (
        titulo.includes(term) ||
        autor.includes(term) ||
        acao.includes(term)
      );
    });
  };

  const filteredLivros = getFilteredLivros();

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>

      {/* 1) ScrollView externo para todo o conteúdo */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Header branco */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Entypo name="book" size={28} color="#006f45" />
            <Text style={styles.headerText}>Biblioteca</Text>
          </View>
        </View>

        {/* Campo de PESQUISA (filtra localmente) */}
        {isLoadingLivros ? (
            <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.remarcarButtonText}>Buscando livros ...</Text>
              <Text style={styles.remarcarButtonText}>Por favor, aguarde.</Text>
            </View> 
          ) : (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar (Título, Autor, Ação)"
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />

            <View style={styles.pickerContainer}>
              {isLoadingUnidades ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Picker
                  selectedValue={selectedUnidade}
                  onValueChange={handleUnidadeChange}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="(Sem unidade, ver todos)" value={null} />
                  {unidades.map((unidade) => (
                    <Picker.Item
                      key={unidade.id}
                      label={unidade.nome}
                      value={unidade.id}
                    />
                  ))}
                </Picker>
              )}
            </View>

            {/* 2) Em vez de ScrollView aqui, usamos apenas uma View simples */}
            <View style={styles.listContainer}>
              {isLoadingLivros ? (
                <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
              ) : filteredLivros.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.text}>Nenhum livro encontrado.</Text>
                </View>
              ) : (
                // => Mapeamos diretamente, SEM outro ScrollView
                <View style={{ width: '100%' }}>
                  {filteredLivros.map((livroItem, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.livroCard}
                      onPress={() => openModal(livroItem)}
                    >
                      <Image
                        source={{ uri: `https://dedstudio.com.br/dev/STV/${livroItem.img}` }}
                        style={styles.image}
                      />
                      <Text style={styles.livroTitle}>{livroItem.livro_titulo}</Text>
                      <Text style={styles.livroAuthor}>{livroItem.livro_autor}</Text>

                      <TouchableOpacity
                        style={styles.remarcarButton}
                        onPress={() => openModal(livroItem)}
                      >
                        <Text style={styles.remarcarButtonText}>Ver Detalhes</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>)}


        {/* Modal de Detalhes */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedLivro && (
                <>
                  <Image
                    source={{ uri: `https://dedstudio.com.br/dev/STV/${selectedLivro.img}` }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  {selectedLivro.livro_titulo && (
                    <Text style={styles.modalTitle}>{selectedLivro.livro_titulo}</Text>
                  )}
                  {selectedLivro.livro_autor && (
                    <Text style={styles.modalText}>Autor: {selectedLivro.livro_autor}</Text>
                  )}
                  {selectedLivro.livro_imprenta && (
                    <Text style={styles.modalText}>Imprenta: {selectedLivro.livro_imprenta}</Text>
                  )}
                  {selectedLivro.livro_editora && (
                    <Text style={styles.modalText}>Editora: {selectedLivro.livro_editora}</Text>
                  )}
                  {selectedLivro.livro_acao && (
                    <Text style={styles.modalText}>Ação: {selectedLivro.livro_acao}</Text>
                  )}
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </LinearGradient>
  );
};

export default BibliotecaScreen;

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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
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
    marginLeft: -30,
  },
  headerText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
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
    textAlign: 'center',
  },
  livroCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  livroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  livroAuthor: {
    fontSize: 14,
    color: '#666',
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
    marginTop: 20,
  },
  remarcarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 15,
    marginBottom: 5,
    color: '#444',
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
