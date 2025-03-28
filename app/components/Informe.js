import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const Informe = () => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);           // URL remota do PDF
  const [localPdfUri, setLocalPdfUri] = useState(null);     // URI do PDF baixado, para compartilhamento
  const [modalVisible, setModalVisible] = useState(false);

  // Busca o informe de rendimento
  const fetchInforme = async () => {
    setLoading(true);
    try {
      // Obtém o id_usuario (caso não esteja salvo, usa um valor default)
      const id_usuario = await AsyncStorage.getItem('id') || '43393';
      const response = await fetch('https://dedstudio.com.br/dev/STV/ws/v1/inf_rend.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: Number(id_usuario) }),
      });
      const data = await response.json();
      if (data.ok && data.msg && data.msg.length > 0) {
        // Monta a URL completa do PDF
        const remotePdfUrl = `https://dedstudio.com.br${data.msg[0]}`;
        setPdfUrl(remotePdfUrl);
      } else {
        Alert.alert('Erro', 'Nenhum informe de rendimento encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar informe:', error);
      Alert.alert('Erro', 'Não foi possível obter os informes.');
    }
    setLoading(false);
  };

  // Faz o download do PDF para compartilhamento, se ainda não baixado
  const downloadPdf = async () => {
    if (!pdfUrl) return;
    try {
      const fileUri = FileSystem.cacheDirectory + 'informe_rendimento.pdf';
      const { uri } = await FileSystem.downloadAsync(pdfUrl, fileUri);
      setLocalPdfUri(uri);
      return uri;
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      Alert.alert('Erro', 'Falha ao baixar o informe.');
    }
  };

  // Função para baixar e compartilhar o PDF
  const handleDownloadAndShare = async () => {
    const uri = await downloadPdf();
    if (!uri) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Informe de Rendimento',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Erro', 'Seu dispositivo não suporta compartilhamento.');
      }
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      Alert.alert('Erro', 'Falha ao compartilhar o informe.');
    }
  };

  // Abre o modal para visualizar o PDF
  const openPdf = () => {
    if (!pdfUrl) return;
    setModalVisible(true);
  };

  // Para exibir o PDF na WebView: se for Android, usamos o Google Docs Viewer
  const getWebViewUrl = () => {
    if (!pdfUrl) return '';
    if (Platform.OS === 'android') {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
    }
    return pdfUrl;
  };

  useEffect(() => {
    fetchInforme();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#006f45" />
      ) : pdfUrl ? (
        <>
          <TouchableOpacity style={styles.button} onPress={openPdf}>
            <MaterialIcons name="picture-as-pdf" size={24} color="#fff" />
            <Text style={styles.buttonText}>Abrir Informe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleDownloadAndShare}>
            <MaterialIcons name="file-download" size={24} color="#fff" />
            <Text style={styles.buttonText}>Baixar / Compartilhar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.noDataText}>Nenhum informe de rendimento disponível.</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleDownloadAndShare}>
              <MaterialIcons name="file-download" size={24} color="#fff" />
              <Text style={styles.shareButtonText}>Baixar / Compartilhar</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: getWebViewUrl() }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator size="large" color="#006f45" style={{ flex: 1 }} />
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006f45',
    padding: 15,
    borderRadius: 8,
    margin: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#006f45',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#006f45',
    padding: 15,
  },
  closeButton: {
    padding: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006f45',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Informe;
