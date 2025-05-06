import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import ContraCheque from '../../components/ContraCheque';
import Informe from '../../components/Informe';

import { useNavigation } from '@react-navigation/native';

// Importar gradiente
import { LinearGradient } from 'expo-linear-gradient';
// Importar array de cores do seu tema
import { GRADIENT_COLORS } from '../../theme';

const DocumentosScreen = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const navigation = useNavigation();


  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
              <FontAwesome name="file" size={24} color="#006f45" />

                <Text style={styles.headerText}>Seus Documentos</Text>
              </View>
            </View>

        {/* Seção: Informe de Rendimentos */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('rendimentos')}
        >
          <Text style={styles.sectionHeaderText}>Informe de Rendimentos</Text>
          <MaterialIcons
            name={expandedSections['rendimentos'] ? 'expand-less' : 'expand-more'}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        {expandedSections['rendimentos'] && (
          <View style={styles.sectionContent}>
            <Informe />
          </View>
        )}

        {/* Seção: Contra-cheques */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('contracheques')}
        >
          <Text style={styles.sectionHeaderText}>Contra-cheques</Text>
          <MaterialIcons
            name={expandedSections['contracheques'] ? 'expand-less' : 'expand-more'}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        {expandedSections['contracheques'] && (
          <View style={styles.sectionContent}>
            <ContraCheque />
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
};

export default DocumentosScreen;

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
  sectionHeader: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  sectionHeaderText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  sectionContent: {
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
});
