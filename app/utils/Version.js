import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const Version = ({home}) => {
    return (
    <View style={[styles.container, home ? styles.primaryStyle : styles.secondaryStyle]}>
            <Text style={styles.text}>2025 • STV Segurança</Text>
            <View style={styles.textName}>
                <Text style={styles.text}>Versão</Text>
                <Text style={styles.text}>1.0.6</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 180,
        padding: 10,
        justifyContent: 'center',
        flexDirection: 'column',
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 15,
    },
    primaryStyle: {
        backgroundColor: 'transparent',
    },
    secondaryStyle: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    textName: {
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        fontSize: 14,
        color: '#000',
        paddingHorizontal: 3

    },
})

export default Version;
