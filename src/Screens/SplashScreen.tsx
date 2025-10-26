import React from 'react';
import {View, Text, StyleSheet, StatusBar, Image} from 'react-native';

const Splash = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
      <Image
                source={require('../Assets/companyLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
 logo: {
    alignSelf: 'center',
    width: 150,
    height: 150,
  },
  logoText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Splash;