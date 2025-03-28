import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import Version from '../../utils/Version';

const MeusDados = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [CPF, setCPF] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Campos para troca de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado para controlar se o container de trocar senha está expandido ou não
  const [showChangePassword, setShowChangePassword] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const cod_pessoa = await AsyncStorage.getItem('cod_pessoa');
        if (!cod_pessoa) {
          Alert.alert('Erro', 'Usuário não encontrado.');
          setIsLoading(false);
          return;
        }
        const response = await api.post('/meus_dados.php', {
          cod_pessoa: cod_pessoa,
        });

        const { ok, msg } = response.data;
        if (!ok) {
          Alert.alert('Erro', msg || 'Erro ao buscar os dados.');
        } else {
          setNome(msg.nome);
          setEmail(msg.email);
          setCPF(msg.cpf);
          setEmpresa(msg.empresa);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Erro ao buscar os dados do usuário. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Função de logout
  const handleLogout = () => {
    Alert.alert('Deslogar', 'Tem certeza que deseja deslogar?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Deslogar',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('token');
            navigation.navigate('Login');
          } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Erro ao deslogar. Tente novamente.');
          }
        },
      },
    ]);
  };

  // Ir para tela de Termos
  const handleGoToTermos = () => {
    navigation.navigate('TermosUso');
  };

  // Voltar
  const handleGoHome = () => {
    navigation.goBack();
  };

  // =================== TROCAR SENHA ===================
  const handleTrocarSenha = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha ambos os campos de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      const idUsuario = await AsyncStorage.getItem('id');
      if (!idUsuario) {
        Alert.alert('Erro', 'Usuário não encontrado para trocar senha.');
        return;
      }

      // const token = await AsyncStorage.getItem('token');
      // if (!token) {
      //   Alert.alert('Erro', 'Token não encontrado para trocar senha.');
      //   return;
      // }

      const body = JSON.stringify({
        tok: "U1RWITJvMjU=",
        id_usuario: Number(idUsuario),
        nova_senha: newPassword,
      })

      // console.log("body", body);

      const response = await api.post('/trocarsenha.php', body);

      const { ok, msg } = response.data;

      // console.log("response.data", response.data);
      
      if (!ok) {
        Alert.alert('Erro ao trocar senha', msg || 'Tente novamente.');
      } else {
        Alert.alert('Sucesso', msg || 'Senha alterada com sucesso!');
        // Limpa campos
        setNewPassword('');
        setConfirmPassword('');
        // Opcional: recolher o card novamente
        setShowChangePassword(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível trocar a senha. Tente novamente.');
    }
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
            <FontAwesome name="user-circle" size={30} color="#006f45" />
            <Text style={styles.headerText}>Seus Dados</Text>
          </View>
        </View>

        {/* Card dos dados */}
        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#006f45" style={{ marginTop: 20 }} />
          ) : (
            <>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={nome} editable={false} />
              </View>

              <View style={styles.labelContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} editable={false} />
              </View>

              <View style={styles.labelContainer}>
                <Text style={styles.label}>CPF</Text>
                <TextInput style={styles.input} value={CPF} editable={false} />
              </View>

              <View style={styles.labelContainer}>
                <Text style={styles.label}>Empresa</Text>
                <TextInput style={styles.input} value={empresa} editable={false} />
              </View>
            </>
          )}
        </View>

        {/* Container expandível - Troca de senha */}
        <View style={styles.card}>
          {/* Header do container: um Touchable que ao clicar expande ou recolhe */}
          <TouchableOpacity
            style={styles.toggleHeader}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={styles.toggleHeaderText}>Alterar Senha</Text>
            <MaterialIcons
              name={showChangePassword ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#333"
            />
          </TouchableOpacity>

          {/* Se showChangePassword estiver true, exibe o conteúdo */}
          {showChangePassword && (
            <View style={styles.expandedArea}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.labelContainer}>
                <Text style={styles.label}>Confirmar Senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleTrocarSenha}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Botões abaixo */}
        <TouchableOpacity style={styles.termosButton} onPress={handleGoToTermos}>
          <Text style={styles.termosButtonText}>Termos de Uso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Deslogar</Text>
        </TouchableOpacity>

        <Version />
      </ScrollView>
    </LinearGradient>
  );
};

export default MeusDados;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
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
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  labelContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    color: '#555',
  },
  // Header do container de troca de senha
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  expandedArea: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#006f45',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  termosButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  termosButtonText: {
    color: '#006f45',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#006f45',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
