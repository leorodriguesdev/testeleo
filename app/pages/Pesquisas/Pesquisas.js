/* src/screens/Pesquisas.js */
import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome5,
  FontAwesome,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import api from '../../services/api';
import { GRADIENT_COLORS } from '../../theme';

/* ------------------------------------------------------------
   Constantes & helpers
------------------------------------------------------------ */
const TIPO_LABEL = {
  1: 'CSAT Carinhas (1‑5)',
  2: 'CSAT Estrelas (1‑5)',
  3: 'NPS (0‑10)',
  4: 'CES Numérico (1‑7)',
  5: 'CES Textual (1‑7)',
  6: 'Sim ou Não',
  7: 'Sim, Não e Não se aplica',
  8: 'Enquete',
};

const CARINHAS = ['sad-tear', 'frown', 'meh', 'smile', 'grin'];
const RANGE_0_10 = [...Array(11).keys()];
const RANGE_1_7   = Array.from({ length: 7 }, (_, i) => i + 1);

/* ------------------------------------------------------------
   Componente principal
------------------------------------------------------------ */
const Pesquisas = () => {
  const navigation = useNavigation();

  const [pesquisas,          setPesquisas]          = useState([]);
  const [isLoading,          setIsLoading]          = useState(false);

  const [perguntas,          setPerguntas]          = useState([]);
  const [alternativas,       setAlternativas]       = useState([]);
  const [altLoading,         setAltLoading]         = useState(false);

  const [selectedResposta,   setSelectedResposta]   = useState(null);

  const [isModalVisible,     setIsModalVisible]     = useState(false);
  const [sending,            setSending]            = useState(false);
  const [idPesquisaSel,      setIdPesquisaSel]      = useState(null);

  /* --------------------- carrega pesquisas -------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const id_usuario = await AsyncStorage.getItem('id');
        if (!id_usuario) throw new Error('Usuário não encontrado.');

        const { data } = await api.post('/pesquisa.php', { id_usuario });
        mounted &&
          (data.ok
            ? setPesquisas(data.msg)
            : Alert.alert('STV', data.msg || 'Nenhuma pesquisa disponível.'));
      } catch (err) {
        console.error(err);
        Alert.alert('Erro', err.message || 'Falha ao buscar pesquisas.');
      } finally {
        mounted && setIsLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  /* ------------------------- abrir modal ---------------------- */
  const openModal = useCallback(async (id_pesquisa) => {
    // limpa estados antes de qualquer coisa
    setPerguntas([]);
    setAlternativas([]);
    setSelectedResposta(null);
    setAltLoading(false);
    setIdPesquisaSel(id_pesquisa);

    try {
      const id_usuario = await AsyncStorage.getItem('id');
      if (!id_usuario) throw new Error('Usuário não encontrado.');

      const { data } = await api.post('/pesquisa_pergunta.php', {
        id_pesquisa,
        id_usuario,
      });

      if (!data.ok || !data.msg?.length) {
        Alert.alert('STV', 'Nenhuma pergunta encontrada!', [
          { text: 'OK', onPress: () => {} },
        ]);
        return;
      }

      setPerguntas(data.msg);        // temos pergunta → exibe modal
      setIsModalVisible(true);

      const pergunta = data.msg[0];
      if (pergunta.tipo === '8') {
        setAltLoading(true);
        const { data: altData } = await api.post('/pesquisa_alternativa.php', {
          id_pergunta: pergunta.id_pergunta,
        });
        altData.ok && altData.msg?.length && setAlternativas(altData.msg);
        setAltLoading(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', err.message || 'Falha ao buscar dados.');
    }
  }, []);

  /* ------------------------- enviar --------------------------- */
  const enviarResposta = useCallback(async () => {
    if (selectedResposta === null) {
      Alert.alert('STV', 'Selecione uma resposta.');
      return;
    }
    setSending(true);
    try {
      const id_usuario = await AsyncStorage.getItem('id');
      const id_pergunta = perguntas[0].id_pergunta;

      const payload = {
        id_pesquisa: idPesquisaSel,
        id_pergunta,
        id_usuario,
        resposta: selectedResposta,
      };

      const { data } = await api.post('/pesquisa_resposta.php', payload);

      data.ok
        ? (Alert.alert('STV', data.msg), closeModal())
        : Alert.alert('STV', data.msg || 'Falha ao gravar resposta.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao enviar resposta.');
    } finally {
      setSending(false);
    }
  }, [selectedResposta, perguntas, idPesquisaSel]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setPerguntas([]);
    setAlternativas([]);
    setSelectedResposta(null);
    setAltLoading(false);
    setIdPesquisaSel(null);
  }, []);

  /* --------------------- render helpers ----------------------- */
  const renderPesquisaItem = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.pesquisaItem} onPress={() => openModal(item.id_pesquisa)}>
        <FontAwesome5 name="question-circle" size={22} color="#006f45" />
        <View style={styles.pesquisaInfo}>
          <Text style={styles.pesquisaText}>{item.titulo}</Text>
          <Text style={styles.tipoLabel}>{TIPO_LABEL[item.tipo]}</Text>
        </View>
      </TouchableOpacity>
    ),
    [openModal]
  );

  const keyExtractor  = useCallback(item => item.id_pesquisa.toString(), []);
  const altKeyExtract = useCallback(item => item.id.toString(), []);
  const getItemLayout = useCallback((_, i) => ({ length: 72, offset: 72 * i, index: i }), []);

  /* ---------------- componentes de resposta ------------------- */
  const RatingCarinhas = memo(() => (
    <View style={styles.rowCenter}>
      {CARINHAS.map((icon, idx) => {
        const val = idx + 1;
        return (
          <TouchableOpacity
            key={icon}
            onPress={() => setSelectedResposta(val)}
            style={styles.ratingItem}
          >
            <FontAwesome5
              name={icon}
              size={32}
              color={selectedResposta === val ? '#006f45' : '#999'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  ));

  const RatingStars = memo(() => (
    <View style={styles.rowCenter}>
      {[1, 2, 3, 4, 5].map(val => (
        <TouchableOpacity
          key={val}
          onPress={() => setSelectedResposta(val)}
          style={styles.ratingItem}
        >
          <FontAwesome
            name={selectedResposta >= val ? 'star' : 'star-o'}
            size={32}
            color="#FFD700"
          />
        </TouchableOpacity>
      ))}
    </View>
  ));

  const RangeButtons = memo(({ range }) => (
    <View style={[styles.rowCenter, { flexWrap: 'wrap' }]}>
      {range.map(val => (
        <TouchableOpacity
          key={val}
          style={[
            styles.rangeButton,
            selectedResposta === val && styles.rangeButtonSelected,
          ]}
          onPress={() => setSelectedResposta(val)}
        >
          <Text
            style={[
              styles.rangeButtonText,
              selectedResposta === val && { color: '#fff' },
            ]}
          >
            {val}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ));

  const QualButtons = memo(({ opts }) => (
    <View style={styles.rowCenter}>
      {opts.map(op => (
        <TouchableOpacity
          key={op.value}
          style={[
            styles.qualButton,
            selectedResposta === op.value && styles.qualButtonSelected,
          ]}
          onPress={() => setSelectedResposta(op.value)}
        >
          <Text
            style={[
              styles.qualButtonText,
              selectedResposta === op.value && { color: '#fff' },
            ]}
          >
            {op.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ));

  const AlternativasList = memo(() => (
    <FlatList
      data={alternativas}
      keyExtractor={altKeyExtract}
      renderItem={({ item }) => {
        const sel = selectedResposta === item.id;
        return (
          <TouchableOpacity
            onPress={() => setSelectedResposta(item.id)}
            style={[
              styles.alternativaItem,
              sel && styles.alternativaItemSel,
            ]}
          >
            <Text style={[styles.alternativaText, sel && styles.alternativaTextSel]}>
              {item.alternativa}
            </Text>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        altLoading ? (
          <ActivityIndicator size="large" color="#006f45" style={styles.altLoader} />
        ) : (
          <Text style={styles.noAltTxt}>Nenhuma alternativa encontrada.</Text>
        )
      }
      style={styles.altList}
      initialNumToRender={10}
      nestedScrollEnabled
    />
  ));

  const QuestionBody = () => {
    if (!perguntas.length) return null;
    const { tipo } = perguntas[0];
    switch (tipo) {
      case '1': return <RatingCarinhas />;
      case '2': return <RatingStars   />;
      case '3': return <RangeButtons range={RANGE_0_10} />;
      case '4': return <RangeButtons range={RANGE_1_7 } />;
      case '5':
        return (
          <>
            <RangeButtons range={RANGE_1_7} />
            <Text style={styles.cesLegend}>1 = Muito fácil  7 = Muito difícil</Text>
          </>
        );
      case '6':
        return <QualButtons opts={[{ value: 'Sim', label: 'Sim' }, { value: 'Não', label: 'Não' }]} />;
      case '7':
        return (
          <QualButtons
            opts={[
              { value: 'Sim', label: 'Sim' },
              { value: 'Não', label: 'Não' },
              { value: 'NSA', label: 'Não se aplica' },
            ]}
          />
        );
      case '8': return <AlternativasList />;
      default:  return <Text>Tipo não suportado.</Text>;
    }
  };

  /* -------------------------- JSX --------------------------- */
  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradientContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#006f45" style={styles.mainLoader} />
      ) : (
        <FlatList
          data={pesquisas}
          keyExtractor={keyExtractor}
          renderItem={renderPesquisaItem}
          getItemLayout={getItemLayout}
          initialNumToRender={15}
          ListHeaderComponent={
            <View style={styles.customHeader}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#006f45" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <FontAwesome5 name="search" size={26} color="#006f45" />
                <Text style={styles.headerText}>Suas Pesquisas</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.card}>
              <FontAwesome5 name="question-circle" size={36} color="#006f45" />
              <Text style={styles.text}>Você não possui pesquisas</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ---------------- Modal ---------------- */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {perguntas.length ? (
              <>
                <FlatList
                  data={[{}]}            /* container scrollável */
                  renderItem={() => (
                    <>
                      <Text style={styles.modalTitle}>{perguntas[0].enunciado}</Text>
                      <QuestionBody />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          (sending || selectedResposta === null) && styles.btnDisabled,
                        ]}
                        disabled={sending || selectedResposta === null}
                        onPress={enviarResposta}
                      >
                        {sending ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.sendButtonText}>Enviar</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  keyExtractor={() => 'body'}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                />
              </>
            ) : (
              <ActivityIndicator size="large" color="#006f45" />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Pesquisas;

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  mainLoader: { marginTop: 40 },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingVertical: 18, paddingHorizontal: 15, borderRadius: 10,
    marginTop: 20, marginBottom: 20, elevation: 5,
  },
  backButton: { padding: 10 },
  headerTitleContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: -30,
  },
  headerText: { fontSize: 20, color: '#333', fontWeight: 'bold', marginLeft: 8 },
  pesquisaItem: {
    backgroundColor: '#fff', borderRadius: 10, paddingTop: 15, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, elevation: 4,
  },
  pesquisaInfo: { marginLeft: 10 },
  pesquisaText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tipoLabel: { fontSize: 12, color: '#666' },
  card: {
    backgroundColor: '#fff', borderRadius: 10, paddingVertical: 20, paddingHorizontal: 40,
    alignItems: 'center', elevation: 6,
  },
  text: { fontSize: 18, color: '#333', fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '92%', maxHeight: '85%', backgroundColor: '#fff',
    borderRadius: 10, padding: 20, elevation: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  rowCenter: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  ratingItem: { marginHorizontal: 6 },
  rangeButton: {
    width: 40, height: 40, margin: 4, borderRadius: 20,
    borderWidth: 1, borderColor: '#006f45', alignItems: 'center', justifyContent: 'center',
  },
  rangeButtonSelected: { backgroundColor: '#006f45' },
  rangeButtonText: { color: '#006f45', fontWeight: 'bold' },
  cesLegend: { textAlign: 'center', color: '#666', marginTop: 8 },
  qualButton: {
    minWidth: 80, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: '#006f45', marginHorizontal: 4, marginVertical: 4,
    alignItems: 'center',
  },
  qualButtonSelected: { backgroundColor: '#006f45' },
  qualButtonText: { color: '#006f45', fontWeight: '600' },
  alternativaItem: {
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6,
    marginBottom: 6, backgroundColor: '#f9f9f9',
  },
  alternativaItemSel: { borderColor: '#006f45', borderWidth: 1 },
  alternativaText: { fontSize: 15, color: '#333' },
  alternativaTextSel: { color: '#006f45', fontWeight: 'bold' },
  altList: { flexGrow: 1, marginBottom: 12 },
  altLoader: { marginVertical: 20 },
  noAltTxt: { textAlign: 'center', marginVertical: 20 },
  sendButton: {
    alignSelf: 'center', marginTop: 10, backgroundColor: '#006f45',
    paddingVertical: 10, paddingHorizontal: 40, borderRadius: 5,
  },
  btnDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
