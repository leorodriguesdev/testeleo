import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { formatDateTime } from '../../utils/utils';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Mapeia as extensões para MIME (igual no exemplo anterior, se quiser)
const EXTENSION_TO_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

const Comunicacao = () => {
  const navigation = useNavigation();

  // Lista de chamados principais
  const [chamados, setChamados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal e chamado selecionado
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState(null);

  // Interações dentro do chamado selecionado
  const [interacoes, setInteracoes] = useState([]);
  const [isLoadingInteracoes, setIsLoadingInteracoes] = useState(false);

  // Novo texto e anexo da interação
  const [msgInteracao, setMsgInteracao] = useState('');
  const [fileInteracao, setFileInteracao] = useState(null);

  useEffect(() => {
    fetchChamados();
  }, []);

  // Carrega a lista de chamados
  const fetchChamados = async () => {
    setIsLoading(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/chamado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          act: 'select',
          id_usuario: id_usuario,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setChamados(data.msg);
      } else {
        Alert.alert('Erro', 'Não foi possível buscar os chamados.');
      }
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao buscar os chamados.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quando clica no card do chamado, abrimos modal e carregamos interações
  const handleOpenModal = (chamado) => {
    setSelectedChamado(chamado);
    setModalVisible(true);
    fetchInteracoes(chamado.id);
  };

  // Fecha modal, limpa estados
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedChamado(null);
    setInteracoes([]);
    setMsgInteracao('');
    setFileInteracao(null);
  };

  // Busca interações (conversas) do chamado
  const fetchInteracoes = async (id_chamado) => {
    setIsLoadingInteracoes(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/chamado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          act: 'interacao-select',
          id_usuario,
          id_chamado,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (data.ok) {
        setInteracoes(data.msg);
      }
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar interações.');
    } finally {
      setIsLoadingInteracoes(false);
    }
  };

  // Botão "Voltar"
  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  // Botão/ícone de anexo no card -> "download" (pode abrir link)
  const handleDownloadAnexo = (anexoPath) => {
    if (!anexoPath) return;
    // Tenta abrir no navegador
    const url = `https://dedstudio.com.br/dev/STV/${anexoPath}`;
    Linking.openURL(url).catch((err) => {
      console.error('Erro ao abrir link:', err);
      Alert.alert('Erro', 'Não foi possível abrir o anexo.');
    });
  };

  // PICKER para anexo de interação
  const handleAttachmentPress = () => {
    Alert.alert('Anexar arquivo', 'Escolha a opção', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar foto', onPress: pickFromCamera },
      { text: 'Galeria', onPress: pickFromGallery },
    ]);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled && result.assets) {
      setFileInteracao(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria de fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled && result.assets) {
      setFileInteracao(result.assets[0].uri);
    }
  };

  // Envia nova interação (mensagem + anexo base64) e recarrega
  const handleSendInteracao = async () => {
    if (!msgInteracao.trim()) {
      Alert.alert('Aviso', 'Digite uma mensagem antes de enviar.');
      return;
    }
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      let base64File = '';
      if (fileInteracao) {
        // converte para base64 + prefix
        let rawFile = await FileSystem.readAsStringAsync(fileInteracao, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // detect extension
        const fileName = fileInteracao.split('/').pop().toLowerCase() || '';
        const ext = fileName.split('.').pop();
        const mime = EXTENSION_TO_MIME[ext] || 'application/octet-stream';
        base64File = `data:${mime};base64,${rawFile}`;
      }

      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/chamado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          act: 'interacao-insert',
          id_usuario,
          id_chamado: selectedChamado.id,
          mensagem: msgInteracao,
          anexo: base64File,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setMsgInteracao('');
        setFileInteracao(null);
        // Recarrega a lista de interações para ver a nova
        fetchInteracoes(selectedChamado.id);
      } else {
        Alert.alert('Erro', 'Não foi possível enviar a interação. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao enviar interação:', err);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar a interação.');
    }
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      {/* Header com background branco */}
      <View style={styles.containerHeader}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="chat" size={30} color="#006f45" />
            <Text style={styles.headerText}>Comunicação</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#006f45" />
        ) : (
          <>
            {chamados.length === 0 ? (
              <View style={styles.messageCard}>
                <FontAwesome5 name="comment-dots" size={36} color="#006f45" />
                <Text style={styles.messageText}>Você não possui chamados abertos</Text>
              </View>
            ) : (
              chamados.map((chamado) => (
                <TouchableOpacity
                  key={chamado.id}
                  style={styles.chamadoCard}
                  onPress={() => handleOpenModal(chamado)}
                >
                  {/* Ícone de anexo se tiver anexo */}
                  {chamado.anexo ? (
                    <TouchableOpacity
                      style={styles.anexoButton}
                      onPress={() => handleDownloadAnexo(chamado.anexo)}
                    >
                      <Feather name="paperclip" size={24} color="#666" />
                      <Text style={styles.anexoText}>Anexo</Text>
                    </TouchableOpacity>
                  ) : null}

                  <Text style={styles.chamadoTitulo}>Assunto: {chamado.assunto}</Text>
                  <Text style={styles.chamadoMensagem}>{chamado.mensagem}</Text>
                  <Text style={styles.chamadoInfo}>
                    Status: {chamado.status === '1' ? 'Aberto' : 'Fechado'}
                  </Text>
                  <Text style={styles.chamadoInfo}>
                    Data: {formatDateTime(chamado.data_registro)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.containerButton}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Chamados')}
        >
          <Text style={styles.buttonText}>Abrir chamado</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedChamado && (
              <>
                <Text style={styles.modalTitle}>
                  Assunto: {selectedChamado.assunto}
                </Text>
                <Text style={styles.modalText}>
                  Status: {selectedChamado.status === '1' ? 'Aberto' : 'Fechado'}
                </Text>
                <Text style={styles.modalText}>
                  Categoria: {selectedChamado.id_categoria}
                </Text>
                <Text style={styles.modalText}>
                  Data: {formatDateTime(selectedChamado.data_registro)}
                </Text>

                {/* Se tiver anexo no chamado, mostrar botão de download */}
                {selectedChamado.anexo ? (
                  <TouchableOpacity
                    style={styles.anexoModalButton}
                    onPress={() => handleDownloadAnexo(selectedChamado.anexo)}
                  >
                    <Feather name="paperclip" size={20} color="#006f45" />
                    <Text style={styles.anexoModalText}>Baixar Anexo Chamado</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Lista de interações */}
                <Text style={styles.subTitle}>Interações:</Text>
                {isLoadingInteracoes ? (
                  <ActivityIndicator color="#006f45" style={{ marginVertical: 10 }} />
                ) : interacoes.length === 0 ? (
                  <Text style={styles.modalText}>Nenhuma interação encontrada.</Text>
                ) : (
                  <ScrollView style={styles.interacoesContainer}>
                    {interacoes.map((item) => (
                      <View key={item.id} style={styles.interacaoItem}>
                        {/* Se houver anexo na interação, exibe o botão de download */}
                        {item.anexo ? (
                          <TouchableOpacity
                            style={styles.anexoButton}
                            onPress={() => handleDownloadAnexo(item.anexo)}
                          >
                            <Feather name="paperclip" size={20} color="#666" />
                            <Text style={styles.anexoText}>Anexo</Text>
                          </TouchableOpacity>
                        ) : null}

                        <Text style={styles.interacaoMensagem}>{item.mensagem}</Text>
                        <Text style={styles.interacaoInfo}>
                          {formatDateTime(item.data_registro)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Input + anexo para nova interação */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.interacaoInput}
                    placeholder="Digite sua mensagem..."
                    value={msgInteracao}
                    onChangeText={setMsgInteracao}
                  />
                  {/* Botão para anexar arquivo na interação */}
                  <TouchableOpacity onPress={handleAttachmentPress} style={styles.interacaoAttachButton}>
                    <Feather name="paperclip" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Se for imagem, pode exibir preview */}
                {fileInteracao && (fileInteracao.endsWith('.jpg') || fileInteracao.endsWith('.png') || fileInteracao.endsWith('.jpeg')) && (
                  <Text style={styles.previewText}>+1 anexo (imagem)</Text>
                )}

                {/* Botão "Enviar" interação */}
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendInteracao}
                >
                  <Text style={styles.sendButtonText}>Enviar</Text>
                </TouchableOpacity>

                {/* Botão fechar */}
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Comunicacao;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  /* Header */
  containerHeader: {
    paddingHorizontal: 20,
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

  /* Nenhum chamado */
  messageCard: {
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
  messageText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },

  /* Card chamado */
  chamadoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  chamadoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  chamadoMensagem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  chamadoInfo: {
    fontSize: 14,
    color: '#999',
    marginBottom: 3,
  },
  anexoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  anexoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },

  /* Rodapé */
  containerButton: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#167450',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
  anexoModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  anexoModalText: {
    marginLeft: 4,
    color: '#006f45',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 8,
  },
  interacoesContainer: {
    maxHeight: 200,
    marginBottom: 10,
  },
  interacaoItem: {
    backgroundColor: '#f6f6f6',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  interacaoMensagem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  interacaoInfo: {
    fontSize: 12,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  interacaoInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginRight: 8,
  },
  interacaoAttachButton: {
    width: 40,
    backgroundColor: '#006f45',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#006f45',
    marginTop: 5,
  },
  sendButton: {
    backgroundColor: '#006f45',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
