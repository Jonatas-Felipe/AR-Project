import React, { useCallback, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ViroARSceneNavigator } from '@viro-community/react-viro';

import * as PlatformUtils from '../../helpers/PlatformUtils';

import ARScene from './ARScene';

const joystickWidth = 200;

const extraInstructionHeight = PlatformUtils.isIPhoneX() ? 5 : 0;
const paddingTop = PlatformUtils.isIPhoneX()
  ? PlatformUtils.iOSTopPadding + extraInstructionHeight
  : 0;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'BebasNeue-Regular',
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'BebasNeue-Regular',
  },
  readyContainer: {
    position: 'absolute',
    height: 170,
    width: '100%',
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButton: {
    position: 'absolute',
    // Use padding vs "top"/"left" so that the entire zone is tappable
    paddingLeft: 15,
    paddingTop: 27 + paddingTop,
  },
  exitImage: {
    height: 21,
    width: 21,
    resizeMode: 'stretch',
  },
  joystickContainer: {
    position: 'absolute',
    height: 130,
    width: 200,
    marginBottom: 10,
    marginLeft: 5,
    bottom: 10,
    left: 10,
  },
  joystickTouchArea: {
    position: 'absolute',
    height: 130,
    width: 200,
    // Android needs a background color on views or it won't be touchable
    backgroundColor: '#ffffff00',
  },
  resetButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    right: 15,
    top: 24 + paddingTop,
  },
  resetImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  directionText: {
    position: 'absolute',
    top: 50,
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  drivingButtonsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 25,
    right: 10,
    width: 150,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drivingButton: {
    height: 70,
    width: 70,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5,
  },
  pedalImage: {
    position: 'absolute',
    height: 70,
    width: 70,
  },
  pedalTouchArea: {
    position: 'absolute',
    height: 70,
    width: 70,
    // Android needs a background color on views or it won't be touchable
    backgroundColor: '#ffffff00',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  touchText: {
    position: 'absolute',
    top: 10,
    left: 0,
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  attributionOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attributionMovieLogoContainer: {
    position: 'absolute',
    top: 100,
    flexDirection: 'column',
  },
  attributionMovieLogo: {
    width: 300,
    height: 75,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  attributionLoadingContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  attributionViroLogo: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    height: 60,
    resizeMode: 'contain',
  },
});

const ARPosterDemo: React.FC = () => {
  const navigation = useNavigation();
  const [showInstructions, setShowInstructions] = useState(true);
  const [instructionOpacity, setInstructionOpacity] = useState(
    new Animated.Value(1),
  );
  const [carControlsOpacity, setCarControlsOpacity] = useState(
    new Animated.Value(0),
  );
  const [isReady, setIsReady] = useState(false);
  const [isOverPlane, setIsOverPlane] = useState(false);
  const [left, setLeft] = useState(false);
  const [up, setUp] = useState(false);
  const [right, setRight] = useState(false);
  const [down, setDown] = useState(false);
  const [leftRightRatio, setLeftRightRatio] = useState(0);
  const [shouldResetCar, setShouldResetCar] = useState(false);

  // this function will be called by the AR system when the user is hovering over a plane
  const setIsOverPlaneState = useCallback(
    (isOverPlaneState: any) => {
      if (isOverPlane !== isOverPlaneState) {
        setIsOverPlane(isOverPlaneState);
      }
    },
    [isOverPlane],
  );

  const getViroARView = useCallback(() => {
    // use viroAppProps to pass in "changing/dynamic" values, passProps is "not" dynamic.
    const viroAppProps = {
      direction:
        (left ? 1 : 0) + (up ? 2 : 0) + (right ? 4 : 0) + (down ? 8 : 0),
      leftRightRatio,
      shouldResetCar,
      isReady,
      setIsOverPlaneState,
    };
    return (
      <ViroARSceneNavigator
        autofocus
        initialScene={{
          scene: ARScene,
        }}
        viroAppProps={viroAppProps}
      />
    );
  }, [
    down,
    isReady,
    left,
    leftRightRatio,
    right,
    setIsOverPlaneState,
    shouldResetCar,
    up,
  ]);

  const getPressDown = useCallback(key => {
    setDown(key);
  }, []);

  const getPressUp = useCallback(key => {
    setUp(key);
  }, []);

  const getDrivingPedals = useCallback(
    () => (
      <View style={styles.drivingButtonsContainer}>
        <View style={styles.drivingButton}>
          <Image
            style={styles.pedalImage}
            // opacity={down ? 0 : 1}
            source={require('../../assets/models/driving_car/pedal_reverse.png')}
          />
          <Image
            style={styles.pedalImage}
            // opacity={!down ? 0 : 1}
            source={require('../../assets/models/driving_car/pedal_reverse_press.png')}
          />
          <View
            style={styles.pedalTouchArea}
            onTouchStart={() => getPressDown(true)}
            onTouchEnd={() => getPressDown(false)}
          />
        </View>

        <View style={styles.drivingButton}>
          <Image
            style={styles.pedalImage}
            // opacity={up ? 0 : 1}
            source={require('../../assets/models/driving_car/pedal_accel.png')}
          />
          <Image
            style={styles.pedalImage}
            // opacity={!up ? 0 : 1}
            source={require('../../assets/models/driving_car/pedal_accel_press.png')}
          />
          <View
            style={styles.pedalTouchArea}
            onTouchStart={() => getPressUp(true)}
            onTouchEnd={() => getPressUp(false)}
          />
        </View>
      </View>
    ),
    [getPressDown, getPressUp],
  );

  const setJoystickProps = useCallback(
    evt => {
      const { locationX } = evt.nativeEvent; // position relative to top left of view
      const { pageX } = evt.nativeEvent; // position relative to top left of screen
      let leftValue = false;
      let rightValue = false;
      let ratio = 0;
      const halfWidth = joystickWidth / 2;
      if (Platform.OS === 'android') {
        // on Android, the locationX reverts to pageX when off the button/view
        if (locationX !== pageX) {
          if (locationX <= halfWidth) {
            leftValue = true;
            ratio = (halfWidth - locationX) / halfWidth;
          } else {
            rightValue = true;
            ratio = (halfWidth - joystickWidth + locationX) / halfWidth;
          }
        } else {
          /*
        if we went off the button to the left or right, then we simply set the
        ratio to max (1)
        */
          // TODO: this isn't actually accurate, we need to keep track of where
          // relative to the top left corner of the button because a soon as we
          // leave the button, we get all page coordinates. keep track on "down"
          ratio = 1;
          leftValue = left;
          rightValue = right;
        }
      } else {
        // iOS
        if (locationX <= 0 || locationX >= joystickWidth) {
          ratio = 1;
          leftValue = left;
          rightValue = right;
        } else {
          if (locationX <= halfWidth) {
            leftValue = true;
            ratio = (halfWidth - locationX) / halfWidth;
          } else {
            rightValue = true;
            ratio = (halfWidth - joystickWidth + locationX) / halfWidth;
          }
        }
      }

      setLeft(leftValue);
      setRight(rightValue);
      setLeftRightRatio(Math.max(Math.min(ratio, 1), 0));
    },
    [left, right],
  );

  const joystickStart = useCallback(
    evt => {
      setJoystickProps(evt);
    },
    [setJoystickProps],
  );

  const joystickMove = useCallback(
    evt => {
      setJoystickProps(evt);
    },
    [setJoystickProps],
  );

  const joystickEnd = useCallback(evt => {
    setLeft(false);
    setRight(false);
    setLeftRightRatio(0);
  }, []);

  const getJoystick = useCallback(() => {
    const rotation = `${left ? '-' : ''}${Math.round(leftRightRatio * 90)}deg`;

    /*
      This is the joystick/steering wheel component, since the image is rotating, we need
      that "invisible" view to capture the touch events.
     */
    return (
      <View style={styles.joystickContainer}>
        <Image
          style={{
            height: 130,
            width: 200,
            resizeMode: 'contain',
            transform: [{ rotate: rotation }],
          }}
          source={require('../../assets/models/driving_car/steering_wheel.png')}
        />
        <View
          style={styles.joystickTouchArea}
          onTouchStart={joystickStart}
          onTouchMove={joystickMove}
          onTouchEnd={joystickEnd}
        />
      </View>
    );
  }, [joystickEnd, joystickMove, joystickStart, left, leftRightRatio]);

  const resetCar = useCallback(() => {
    setShouldResetCar(true);
    // reset the flag 1 second later.
    setTimeout(() => {
      setShouldResetCar(false);
    }, 1000);
  }, []);

  const getResetButton = useCallback(
    () => (
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetCar}
        activeOpacity={0.6}
      >
        <Image
          style={styles.resetImage}
          source={require('../../assets/models/driving_car/icon_refresh.png')}
        />
      </TouchableOpacity>
    ),
    [resetCar],
  );

  const getCarControls = useCallback(
    () => (
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: carControlsOpacity,
        }}
      >
        {/* These are the controls to drive the car */}
        {getDrivingPedals()}
        {getResetButton()}
        {getJoystick()}
      </Animated.View>
    ),
    [carControlsOpacity, getDrivingPedals, getJoystick, getResetButton],
  );

  const ready = useCallback(() => {
    // only allow ready to be clicked when the user has click over a plane!
    if (!isOverPlane) {
      return;
    }

    Animated.timing(instructionOpacity, {
      useNativeDriver: true,
      toValue: 0,
      duration: 1000,
      easing: Easing.linear,
    }).start(() => {
      setShowInstructions(false);
      setIsReady(true);
    });

    setTimeout(() => {
      Animated.timing(carControlsOpacity, {
        useNativeDriver: true,
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
      }).start();
    }, 1000);
  }, [carControlsOpacity, instructionOpacity, isOverPlane]);

  const getReadyUI = useCallback(() => {
    if (showInstructions) {
      const text = isOverPlane ? ' ' : 'Finding the floor...';

      return (
        <Animated.View
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: instructionOpacity,
          }}
        >
          <View style={styles.readyContainer}>
            <Text style={styles.instructionText}>{text}</Text>
            <TouchableOpacity
              style={{
                height: 60,
                width: 130,
                marginTop: 10,
                backgroundColor: '#292930B3',
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isOverPlane ? 1 : 0.5,
              }}
              // opacity={0.5}
              onPress={ready}
              disabled={!isOverPlane}
              activeOpacity={0.6}
            >
              <Text style={styles.instructionText}>Place</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }
  }, [instructionOpacity, isOverPlane, ready, showInstructions]);

  const getInstructions = useCallback(() => {
    if (!showInstructions) {
      return;
    }

    const instructions = 'Scan the ground and tap Place to begin.';

    return (
      <Animated.View
        style={{
          position: 'absolute',
          backgroundColor: '#000000B3',
          flexDirection: 'column',
          width: '100%',
          height: 100,
          justifyContent: 'center',
          top: 0,
          left: 0,
          paddingTop,
          opacity: instructionOpacity,
        }}
      >
        <Text style={styles.instructionText}>{instructions}</Text>
      </Animated.View>
    );
  }, [instructionOpacity, showInstructions]);

  const exitAR = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.outerContainer}>
      {getViroARView()}

      {getCarControls()}

      {/* Get instructions and ready */}
      {getReadyUI()}
      {getInstructions()}
    </View>
  );
};

export default ARPosterDemo;
