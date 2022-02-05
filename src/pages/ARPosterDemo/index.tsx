import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ViroARSceneNavigator } from '@viro-community/react-viro';

import ARScene from './ARScene';

const styles = StyleSheet.create({
  f1: { flex: 1 },
  helloWorldTextStyle: {
    fontFamily: 'Arial',
    fontSize: 30,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
    width: 250,
  },
});

const localStyles = StyleSheet.create({
  outer: {
    flex: 1,
  },

  arView: {
    flex: 1,
  },

  buttons: {
    height: 80,
    width: 80,
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#00000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff00',
  },
});

const ARPosterDemo: React.FC = () => (
  <View style={localStyles.outer}>
    <ViroARSceneNavigator
      autofocus
      initialScene={{
        scene: ARScene,
      }}
      style={styles.f1}
    />
  </View>
);

export default ARPosterDemo;
