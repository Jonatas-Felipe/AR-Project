import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Image,
  Alert,
} from 'react-native';

import { ViroARSceneNavigator } from '@viro-community/react-viro';

import renderIf from '../../helpers/renderIf';
import ARScene from './ARScene';

// Array of 3d models that we use in this sample. This app switches between this these models.
const objArray = [
  require('../../assets/models/coffee_mug/object_coffee_mug.vrx'),
  require('../../assets/models/object_flowers/object_flowers.vrx'),
  require('../../assets/models/emoji_smile/emoji_smile.vrx'),
];

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

const ARHitTestSample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInitialized, setTrackingInitialized] = useState(false);

  const onLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onTrackingInit = useCallback(() => {
    setTrackingInitialized(true);
  }, []);

  const [viroAppProps, setViroAppProps] = useState({
    displayObject: false,
    objectSource: objArray[0],
    yOffset: 0,
    onLoadEnd,
    onLoadStart,
    onTrackingInit,
  });

  const renderTrackingText = useCallback(() => {
    if (trackingInitialized) {
      return (
        <View
          style={{
            position: 'absolute',
            backgroundColor: '#ffffff22',
            left: 30,
            right: 30,
            top: 30,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: '#ffffff' }}>
            Tracking initialized.
          </Text>
        </View>
      );
    }
    return (
      <View
        style={{
          position: 'absolute',
          backgroundColor: '#ffffff22',
          left: 30,
          right: 30,
          top: 30,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 12, color: '#ffffff' }}>
          Waiting for tracking to initialize.
        </Text>
      </View>
    );
  }, [trackingInitialized]);

  const onShowObject = useCallback((objIndex, objUniqueName, yOffset) => {
    setViroAppProps(state => ({
      ...state,
      displayObject: true,
      yOffset,
      displayObjectName: objUniqueName,
      objectSource: objArray[objIndex],
    }));
  }, []);

  const onDisplayDialog = useCallback(() => {
    Alert.alert('Choose an object', 'Select an object to place in the world!', [
      {
        text: 'Coffee Mug',
        onPress: () => onShowObject(0, 'coffee_mug', 0),
      },
      {
        text: 'Flowers',
        onPress: () => onShowObject(1, 'flowers', 0.29076),
      },
      {
        text: 'Smile Emoji',
        onPress: () => onShowObject(2, 'smile_emoji', 0.497823),
      },
    ]);
  }, [onShowObject]);

  return (
    <View style={localStyles.outer}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{
          scene: ARScene,
          passProps: {
            displayObject: viroAppProps.displayObject,
          },
        }}
        viroAppProps={viroAppProps}
        style={styles.f1}
      />
      {renderTrackingText()}

      {renderIf(
        isLoading,
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator
            size="large"
            animating={isLoading}
            color="#ffffff"
          />
        </View>,
      )}

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 77,
          alignItems: 'center',
        }}
      >
        <TouchableHighlight
          style={localStyles.buttons}
          onPress={onDisplayDialog}
          underlayColor="#00000000"
        >
          <Image
            source={require('../../assets/defaults/btn_mode_objects.png')}
          />
        </TouchableHighlight>
      </View>
    </View>
  );
};

export default ARHitTestSample;
