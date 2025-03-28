import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import api from '../services/api';

const STORAGE_KEY = '@paychecks';      // Chave para lista de contracheques
const STORAGE_YEAR_KEY = '@selectedYear'; // Chave para o ano selecionado

const ContraCheque = () => {
  const [paychecks, setPaychecks] = useState([]);          // Lista de contracheques
  const [loading, setLoading] = useState(false);           // Estado de carregamento
  const [selectedPaycheck, setSelectedPaycheck] = useState(null); // Contracheque selecionado p/ visualizar
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // Ano atual como default

  // 1. Obter anos disponíveis (atual - 5 anos, por exemplo)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push((currentYear - i).toString());
    }
    return years;
  };

  // 2. Retornar nome do mês a partir do número
  const getMonthName = (monthNumber, type = 'normal') => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril',
      'Maio', 'Junho', 'Julho', 'Agosto',
      'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    if (type === '13_1') return '13º Salário - 1ª Parcela';
    if (type === '13_2') return '13º Salário - 2ª Parcela';
    if (type === 'ferias') {
      const indexFerias = parseInt(monthNumber, 10) - 1;
      return `Férias - ${monthNames[indexFerias] || ''}`;
    }

    const index = parseInt(monthNumber, 10) - 1;
    return monthNames[index] || '';
  };

  // 3. Carregar contracheques do AsyncStorage
  const loadPaychecksFromStorage = async () => {
    try {
      const storedPaychecks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedPaychecks !== null) {
        return JSON.parse(storedPaychecks);
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar contracheques do armazenamento:', error);
      return [];
    }
  };

  // 4. Salvar contracheques no AsyncStorage
  const savePaychecksToStorage = async (paychecksList) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(paychecksList));
    } catch (error) {
      console.error('Erro ao salvar contracheques no armazenamento:', error);
    }
  };

  // 5. Função para adicionar e processar 1 contracheque no state + storage
  const processPaycheck = (data, formattedMonth, currentYear, type = 'normal') => {
    if (data.ok === false) {
      // Não adicionar à lista se houver erro
      console.log(`Erro para ${formattedMonth}/${currentYear} [${type}]: ${data.msg}`);
    } else {
      // Montar objeto do contracheque
      const newPaycheck = {
        // Identificador único: year-month-type
        id: `${currentYear}-${formattedMonth}-${type}`,
        monthNumber: formattedMonth,
        monthName: getMonthName(formattedMonth, type),
        year: currentYear,
        htmlContent: data.msg,   // HTML do contracheque
        type: type,              // 'normal', 'ferias', '13_1', '13_2'
      };

      // Atualizar estado e AsyncStorage
      setPaychecks((prev) => {
        const updatedPaychecks = [...prev, newPaycheck];
        savePaychecksToStorage(updatedPaychecks);
        return updatedPaychecks;
      });
    }
  };

  // 6. Buscar contracheque de um tipo (normal, férias, 13_1, 13_2) para um mês
  const fetchPaycheck = async (formattedMonth, currentYear, type = 'normal') => {
    const cod_pessoa = await AsyncStorage.getItem('cod_pessoa');

    let endpoint = 'folha_pagamento_html.php';
    let vigencia = `${currentYear}${formattedMonth}`;

    // Ajuste para endpoints específicos
    if (type === '13_1') {
      endpoint = 'folha_pagamento13_1_html.php';
      vigencia = `${currentYear}11`; // 1ª parcela sempre "vigencia" 202X11
    } else if (type === '13_2') {
      endpoint = 'folha_pagamento13_2_html.php';
      vigencia = `${currentYear}12`; // 2ª parcela sempre "vigencia" 202X12
    } else if (type === 'ferias') {
      endpoint = 'folha_pagamento_ferias_html.php';
      // vigencia fica: currentYear + formattedMonth (ex: 202406)
    }

    try {
      const response = await api.post(endpoint, {
        cod_pessoa: cod_pessoa,
        vigencia: vigencia,
      });

      const rawData = response.data;
      if (!rawData) return;

      // Verifica se vem string ou objeto
      if (typeof rawData === 'string') {
        // Tenta converter a última linha em JSON
        const jsonString = rawData.trim().split('\n').pop();
        const data = JSON.parse(jsonString);
        processPaycheck(data, formattedMonth, currentYear, type);
      } else if (typeof rawData === 'object') {
        processPaycheck(rawData, formattedMonth, currentYear, type);
      } else {
        console.error('Formato inesperado de rawData:', rawData);
      }
    } catch (error) {
      console.error(`Erro na requisição para ${formattedMonth}/${currentYear} [${type}]:`, error);
    }
  };

  // 7. Verificar se existe férias em determinado mês/ano
  const fetchHasVacation = async (formattedMonth, currentYear) => {
    const cod_pessoa = await AsyncStorage.getItem('cod_pessoa');
    const vigencia = `${currentYear}${formattedMonth}`; // Ex: "202406"

    try {
      const response = await api.post('folha_pagamento_tem_ferias.php', {
        cod_pessoa: cod_pessoa,
        vigencia: vigencia,
      });

      const data = response.data;
      // data = { ok: true, msg: true ou false }
      if (data.ok === true && data.msg === true) {
        // Se tiver férias, buscamos o contracheque de férias
        await fetchPaycheck(formattedMonth, currentYear, 'ferias');
      }
    } catch (error) {
      console.error(`Erro ao verificar férias para ${formattedMonth}/${currentYear}:`, error);
    }
  };

  // 8. Buscar todos os contracheques do ano selecionado
  const fetchAllPaychecksForYear = async (year) => {
    setLoading(true);
    setPaychecks([]); // Limpar contracheques antigos
    await savePaychecksToStorage([]); // Limpar no AsyncStorage também

    // Salvar ano selecionado
    try {
      await AsyncStorage.setItem(STORAGE_YEAR_KEY, year);
    } catch (error) {
      console.error('Erro ao salvar o ano selecionado:', error);
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1..12

    let monthsToFetch = [];

    // Se for o ano atual, buscamos até o mês atual
    if (parseInt(year, 10) === currentYear) {
      for (let i = 1; i <= currentMonth; i++) {
        const formattedMonth = i.toString().padStart(2, '0');
        monthsToFetch.push({ month: formattedMonth, year: year });
      }
    } else if (parseInt(year, 10) < currentYear) {
      // Ano passado, buscar todos os 12 meses
      for (let i = 1; i <= 12; i++) {
        const formattedMonth = i.toString().padStart(2, '0');
        monthsToFetch.push({ month: formattedMonth, year: year });
      }
    } else {
      // Ano futuro, provavelmente não tem dados
      Alert.alert('Ano Inválido', 'Por favor, selecione um ano válido.');
      setLoading(false);
      return;
    }

    // 8.1. Buscar contracheques normais e verificar férias mês a mês
    for (const { month, year } of monthsToFetch) {
      // Contracheque normal
      await fetchPaycheck(month, year, 'normal');

      // Verifica se tem férias, se tiver, busca contracheque de férias
      await fetchHasVacation(month, year);
    }

    // 8.2. Buscar 13_1 e 13_2
    // Regra: se ano < ano atual, busca sempre as duas parcelas
    //        se ano == ano atual, busca conforme o mês atual (>= nov e >= dez)
    if (parseInt(year, 10) < currentYear) {
      await fetchPaycheck(null, year, '13_1');
      await fetchPaycheck(null, year, '13_2');
    } else if (parseInt(year, 10) === currentYear) {
      if (currentMonth >= 11) {
        await fetchPaycheck(null, year, '13_1');
      }
      if (currentMonth >= 12) {
        await fetchPaycheck(null, year, '13_2');
      }
    }

    setLoading(false);
  };

  // 9. useEffect -> ao montar, carrega o ano salvo e busca contracheques
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      // Carregar ano salvo
      let storedYear = new Date().getFullYear().toString();
      try {
        const savedYear = await AsyncStorage.getItem(STORAGE_YEAR_KEY);
        if (savedYear !== null) {
          storedYear = savedYear;
        }
      } catch (error) {
        console.error('Erro ao carregar o ano selecionado:', error);
      }
      setSelectedYear(storedYear);

      // Buscar todos contracheques do ano
      await fetchAllPaychecksForYear(storedYear);

      setLoading(false);
    };

    initialize();
  }, []);

  // ======================================
  // FUNÇÃO PARA GERAR E COMPARTILHAR PDF
  // ======================================
  const handleDownloadAndShare = async () => {
    try {
      if (!selectedPaycheck) return;

      // 1. Gera PDF a partir do HTML do contracheque
      const { uri } = await Print.printToFileAsync({
        html: selectedPaycheck.htmlContent,
      });

      // 2. Compartilha o arquivo PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Contracheque',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Ops', 'Seu dispositivo não suporta compartilhamento de arquivos.');
      }
    } catch (error) {
      console.error('Erro ao gerar ou compartilhar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar ou compartilhar o contracheque.');
    }
  };

  return (
    <View style={styles.container}>

      {/* Picker de anos */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Selecione o Ano:</Text>
        <Picker
          selectedValue={selectedYear}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setSelectedYear(itemValue);
            fetchAllPaychecksForYear(itemValue);
          }}
        >
          {getAvailableYears().map((year) => (
            <Picker.Item label={year} value={year} key={year} />
          ))}
        </Picker>
      </View>

      {/* Loading ao buscar */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006f45" />
          <Text style={styles.loadingText}>Buscando contra-cheques, aguarde...</Text>
        </View>
      )}

      {/* Lista de contracheques (botões) */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {paychecks.map((paycheck) => (
          <TouchableOpacity
            key={paycheck.id}
            style={styles.documentButton}
            onPress={() => setSelectedPaycheck(paycheck)}
          >
            <MaterialIcons name="launch" size={20} color="#fff" />
            <Text style={styles.documentButtonText}>
              {paycheck.monthName} {paycheck.type === 'normal' ? paycheck.year : ''}
            </Text>
          </TouchableOpacity>
        ))}

        {!loading && paychecks.length === 0 && (
          <Text style={styles.noDataText}>Nenhum contracheque disponível.</Text>
        )}
      </ScrollView>

      {/* Modal para exibir o HTML do contracheque */}
      <Modal
        visible={selectedPaycheck !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPaycheck(null)}
      >
        <View style={styles.modalContainer}>

          {/* Barra superior do modal com botões */}
          <View style={styles.modalHeader}>
            {/* Botão de Fechar */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPaycheck(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Botão de Baixar / Compartilhar */}
            <TouchableOpacity style={styles.shareButton} onPress={handleDownloadAndShare}>
              <MaterialIcons name="file-download" size={24} color="#fff" />
              <Text style={styles.shareButtonText}>Baixar / Compartilhar</Text>
            </TouchableOpacity>
          </View>

          {/* WebView com o HTML do contra-cheque */}
          {selectedPaycheck && (
            <WebView
              originWhitelist={['*']}
              source={{ html: selectedPaycheck.htmlContent }}
              style={styles.webview}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006f45',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    // sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
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
  // Cabeçalho do modal, contendo os botões de fechar e compartilhar
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

export default ContraCheque;
