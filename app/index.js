import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './pages/Login/Login';
import HomeScreen from './pages/Home/Home';
import MeusDadosScreen from './pages/MeusDados/MeusDados';
import EventosScreen from './pages/Eventos/Eventos';
import DocumentosScreen from './pages/Documentos/Documentos';
import BibliotecaScreen from './pages/Biblioteca/Biblioteca';
import ComunicacaoScreen from './pages/Comunicacao/Comunicacao';
import PesquisasScreen from './pages/Pesquisas/Pesquisas';
import TermosUsoScreen from './pages/TermosUso/TermosUso';
import NovidadesScreen from './pages/Novidades/Novidades';
import ChamadosScreen from './pages/Comunicacao/Chamados';
import RecuperaScreen from './pages/Recupera/Recupera';

const Stack = createStackNavigator();

const Routes = () => {
  const [initialRoute, setInitialRoute] = useState(null); // Rota inicial dinâmica
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userId = await AsyncStorage.getItem('id');
        if (userId) {
          setInitialRoute('Home'); // Se o ID existir, vai para Home
        } else {
          setInitialRoute('Login'); // Se não, vai para Login
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setInitialRoute('Login'); // Em caso de erro, envia para Login
      } finally {
        setIsLoading(false); // Carregamento finalizado
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    // Tela de carregamento enquanto verifica o AsyncStorage
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#006f45" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen name="MeusDados" component={MeusDadosScreen} />
      <Stack.Screen name="Eventos" component={EventosScreen} />
      <Stack.Screen name="Documentos" component={DocumentosScreen} />
      <Stack.Screen name="Biblioteca" component={BibliotecaScreen} />
      <Stack.Screen name="Comunicacao" component={ComunicacaoScreen} />
      <Stack.Screen name="Pesquisas" component={PesquisasScreen} />
      <Stack.Screen name="TermosUso" component={TermosUsoScreen} />
      <Stack.Screen name="Novidades" component={NovidadesScreen} />
      <Stack.Screen name="Chamados" component={ChamadosScreen} />
      <Stack.Screen name="Recupera" component={RecuperaScreen} />

    </Stack.Navigator>
  );
};

export default Routes;
