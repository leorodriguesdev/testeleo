import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';

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

const Chamados = () => {
  const [categories, setCategories] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [assunto, setAssunto] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const id_usuario = await AsyncStorage.getItem('id');
    try {
      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/chamado-categs.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario }),
      });

      const data = await response.json();
      if (data.ok) {
        setCategories(data.msg);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as categorias.');
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao buscar as categorias.');
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      'Anexar arquivo',
      'Escolha a opção',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar foto', onPress: pickFromCamera },
        { text: 'Galeria', onPress: pickFromGallery },
      ]
    );
  };

  // Abrir câmera
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setSelectedFile(result.assets[0].uri);
    }
  };

  // Abrir galeria
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria de fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setSelectedFile(result.assets[0].uri);
    }
  };

  const handleOpenChamado = async () => {
    if (!assunto || !selectedValue || !description) {
      Alert.alert('Campos vazios', 'Por favor, preencha todos os campos antes de abrir o chamado.');
      return;
    }

    try {
      const id_usuario = await AsyncStorage.getItem('id');
      const cpf = await AsyncStorage.getItem('cpf');

      let base64File = '';
      if (selectedFile) {
        // Lê o arquivo todo em base64
        base64File = await FileSystem.readAsStringAsync(selectedFile, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Descobre extensão
        const fileName = selectedFile.split('/').pop().toLowerCase() || '';
        const ext = fileName.split('.').pop(); // "jpg", "png", "pdf", etc.

        let mimeType = EXTENSION_TO_MIME[ext] || 'application/octet-stream';

        // Monta data:<mime>;base64, ...
        base64File = `data:${mimeType};base64,${base64File}`;
      }

      const bodyPayload = {
        act: 'insert',
        id_usuario: id_usuario || '',
        cpf: cpf || '',
        assunto: assunto,
        categoria: selectedValue,
        mensagem: description,
        anexo: base64File,
      };

      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/chamado.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();
      if (data.ok) {
        Alert.alert('Sucesso', 'Chamado aberto com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Comunicacao') },
        ]);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o chamado. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao abrir chamado:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao abrir o chamado.');
    }
  };

  const handleGoBack = () => {
    navigation.navigate('Comunicacao');
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#006f45" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="comment-dots" size={30} color="#006f45" />
            <Text style={styles.headerText}>Chamados</Text>
          </View>
        </View>

        {/* Formulário */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Assunto"
            value={assunto}
            onChangeText={setAssunto}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(itemValue) => setSelectedValue(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Categoria" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.titulo} value={cat.id} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.attachmentButton} onPress={handleAttachmentPress}>
            <Text style={styles.attachmentButtonText}>Anexar arquivo</Text>
            <FontAwesome5 name="camera" size={20} color="#fff" style={{ marginHorizontal: 10 }} />
            <FontAwesome5 name="paperclip" size={20} color="#fff" />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mensagem"
            value={description}
            onChangeText={setDescription}
            multiline={true}
          />

          {/* Se for imagem (jpeg/png), podemos exibir preview */}
          {selectedFile && (selectedFile.endsWith('.png') || selectedFile.endsWith('.jpg') || selectedFile.endsWith('.jpeg')) && (
            <View style={{ marginVertical: 10 }}>
              <Image
                source={{ uri: selectedFile }}
                style={{ width: 200, height: 150, borderRadius: 8 }}
                resizeMode="cover"
              />
              <Text style={{ marginTop: 5, textAlign: 'center' }}>Preview imagem</Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleOpenChamado}>
            <Text style={styles.buttonText}>Abrir chamado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Chamados;

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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006f45',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  attachmentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#006f45',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
