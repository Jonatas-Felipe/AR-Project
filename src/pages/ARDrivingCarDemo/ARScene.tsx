import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ViroARScene,
  ViroConstants,
  Viro3DObject,
  ViroAmbientLight,
  ViroMaterials,
  ViroNode,
  ViroLightingEnvironment,
  ViroImage,
  ViroSound,
  ViroQuad,
} from '@viro-community/react-viro';

const carScale = 0.1; // this is the scale of the car

// NOTE: make sure friction != drivingAcceleration!
const maxSpeed = 0.19 * carScale; // m/s
const drivingAcceleration = 0.08 * carScale; // m/s/s
const reverseAcceleration = 0.17 * carScale; // m/s/s
const friction = -0.03 * carScale; // m/s/s
const intervalTime = 16; // ms
const distanceToFullTurn = 0.4 * carScale; // meters - this is how far the car should travel before it completes a circle
const wheelCircumference = 1 * carScale;
const maxLeanRotation = 10;
let currentAcceleration = 0; // m/s/s
let currentVelocity = 0; // m/s
let currentPosition = [0, 0, 0];
let currentDirection = [0, 0, -1];
let currentRotation = 0; // this is a rotation about the Y in radians...
let currentLeanRotation = 0;
let wheelTurnRotation = 0; // the rotation of the wheel due to a turn (Y-ais)
let wheelDrivingRotation = 0; // the rotation of the wheel due to driving (X-axis)

// keeps track of the prop value!
let shouldResetCarValue = false;

interface IARScene {
  arSceneNavigator: any;
}

const ARScene: React.FC<IARScene> = ({ arSceneNavigator }) => {
  const carRef = useRef<any>(null);
  const frontRightWheelContainerRef = useRef<any>(null);
  const frontLeftWheelContainerRef = useRef<any>(null);
  const carRotationNodeRef = useRef<any>(null);
  const frontRightWheelRef = useRef<any>(null);
  const frontLeftWheelRef = useRef<any>(null);
  const rearRightWheelRef = useRef<any>(null);
  const rearLeftWheelRef = useRef<any>(null);
  const ambientLightRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);

  const [text, setText] = useState('Initializing AR...');
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [modelWorldRotation, setModelWorldRotation] = useState([0, 0, 0]);
  const [displayHitReticle, setDisplayHitReticle] = useState(false);
  const [foundPlane, setFoundPlane] = useState(false);
  const [planeReticleLocation, setPlaneReticleLocation] = useState([0, 0, 0]);
  const [shouldBillboard, setShouldBillboard] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [lastFoundPlaneLocation, setLastFoundPlaneLocation] = useState([
    0, 0, 0,
  ]);
  const [volumeLevel, setVolumeLevel] = useState(0.3);
  const [showCone, setShowCone] = useState(false);

  const computeAcceleration = useCallback(() => {
    const pressedDirectionButtons = arSceneNavigator.viroAppProps.direction;

    if ((pressedDirectionButtons & 2) > 0) {
      if (currentVelocity < 0) {
        currentAcceleration = reverseAcceleration;
      } else {
        currentAcceleration = drivingAcceleration;
      }
    } else if ((pressedDirectionButtons & 8) > 0) {
      if (currentVelocity > 0) {
        currentAcceleration = -reverseAcceleration;
      } else {
        currentAcceleration = -drivingAcceleration;
      }
    } else {
      // if we were accelerating forward or were already applying friction, then keep applying friction
      if (
        currentAcceleration === drivingAcceleration ||
        currentAcceleration === friction
      ) {
        currentAcceleration = friction;
      } else {
        currentAcceleration = -friction;
      }
    }
  }, [arSceneNavigator.viroAppProps.direction]);

  const computeNewLocation = useCallback(() => {
    const pressedDirectionButtons = arSceneNavigator.viroAppProps.direction;

    const computedVelocity =
      currentVelocity + currentAcceleration * (intervalTime / 1000);

    if (currentAcceleration === friction) {
      // if we aren't driving (friction) then make sure we never fall below 0 speed
      currentVelocity = Math.max(computedVelocity, 0);
    } else if (currentAcceleration === -friction) {
      // if we aren't driving (negative friction) then make sure we never go above 0 speed
      currentVelocity = Math.min(computedVelocity, 0);
    } else {
      // if we are driving, then make sure we never go above maxSpeed (in either positive or negative)
      currentVelocity = Math.max(
        Math.min(computedVelocity, maxSpeed),
        -maxSpeed,
      );
    }

    // immediately compute the next frame's accelerations now (it can be later, but sometimes we return early)
    computeAcceleration();

    let desiredLeanRotation = 0;
    // compute new directions based on the joystick
    const turnRatio = arSceneNavigator.viroAppProps.leftRightRatio;
    if ((pressedDirectionButtons & 5) > 0) {
      // if left or right was pressed...
      let additionalRotation = 0;
      if ((pressedDirectionButtons & 1) > 0) {
        // Left
        additionalRotation =
          -(
            ((currentVelocity * (intervalTime / 1000)) / distanceToFullTurn) *
            turnRatio
          ) *
          2 *
          Math.PI; // radians
        wheelTurnRotation = turnRatio * 60;
        desiredLeanRotation =
          -maxLeanRotation * Math.abs(currentVelocity / maxSpeed);
      } else if ((pressedDirectionButtons & 4) > 0) {
        // right
        additionalRotation =
          ((currentVelocity * (intervalTime / 1000)) / distanceToFullTurn) *
          turnRatio *
          2 *
          Math.PI; // radians
        wheelTurnRotation = turnRatio * -60;
        desiredLeanRotation =
          maxLeanRotation * Math.abs(currentVelocity / maxSpeed);
      }

      // compute new currentDirection based on the new additional rotation we're adding
      currentDirection = [
        Math.cos(additionalRotation) * currentDirection[0] -
          Math.sin(additionalRotation) * currentDirection[2], // x
        0, // y
        Math.sin(additionalRotation) * currentDirection[0] +
          Math.cos(additionalRotation) * currentDirection[2], // z
      ];

      currentRotation -= additionalRotation; // our platform rotation is "opposite" of the equation here
    } else {
      wheelTurnRotation = 0;
    }

    // based on the desiredLeanRotation, move the currentLeanRotation .5 degrees towards the desired one
    if (currentLeanRotation !== desiredLeanRotation) {
      if (currentLeanRotation > desiredLeanRotation) {
        currentLeanRotation -= 0.5;
      } else {
        currentLeanRotation += 0.5;
      }
    }

    // set the front wheels' turn rotation
    frontRightWheelContainerRef.current.setNativeProps({
      rotation: [0, wheelTurnRotation, 0],
    });
    frontLeftWheelContainerRef.current.setNativeProps({
      rotation: [0, wheelTurnRotation, 0],
    });

    if (currentVelocity !== 0) {
      // compute the new position & wheel turn.
      const distanceX = currentDirection[0] * currentVelocity;
      const distanceY = currentDirection[1] * currentVelocity;
      const distanceZ = currentDirection[2] * currentVelocity;
      currentPosition = [
        currentPosition[0] + distanceX,
        currentPosition[1] + distanceY,
        currentPosition[2] + distanceZ,
      ];

      const totalDistance = Math.sqrt(
        distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ,
      );
      // we need to negativize because that's how our axis are set up
      let additionalDriveRotation = (-totalDistance / wheelCircumference) * 360;
      if (currentVelocity < 0) {
        additionalDriveRotation = -additionalDriveRotation; // rotation should be backwards if we're in reverse!
      }
      wheelDrivingRotation =
        (wheelDrivingRotation + additionalDriveRotation) % 360;

      // set the car's rotation/position
      carRef.current.setNativeProps({
        position: currentPosition,
        rotation: [0, (currentRotation * 180) / Math.PI, 0], // we're only rotating about the Y & we need to convert to degrees
      });

      carRotationNodeRef.current.setNativeProps({
        rotation: [0, 0, currentLeanRotation],
      });

      // set all the wheel's driving rotation
      frontRightWheelRef.current.setNativeProps({
        rotation: [wheelDrivingRotation, 0, 0],
      });
      frontLeftWheelRef.current.setNativeProps({
        rotation: [wheelDrivingRotation, 0, 0],
      });
      rearRightWheelRef.current.setNativeProps({
        rotation: [wheelDrivingRotation, 0, 0],
      });
      rearLeftWheelRef.current.setNativeProps({
        rotation: [wheelDrivingRotation, 0, 0],
      });
    }
  }, [
    arSceneNavigator.viroAppProps.direction,
    arSceneNavigator.viroAppProps.leftRightRatio,
    computeAcceleration,
  ]);

  const setInitialCarDirection = useCallback(() => {
    if (carRef.current) {
      carRef.current.getTransformAsync().then((retDict: any) => {
        const { rotation } = retDict;
        const absX = Math.abs(rotation[0]);
        const absZ = Math.abs(rotation[2]);

        let yRotation = rotation[1];

        // if the X and Z aren't 0, then adjust the y rotation (the quaternion flipped the X or Z).
        if (absX !== 0 && absZ !== 0) {
          yRotation = 180 - yRotation;
        }

        setModelWorldRotation([0, yRotation, 0]);
        setShouldBillboard(false);

        setInterval(() => {
          computeNewLocation();
        }, intervalTime);
      });
    }
  }, [computeNewLocation]);

  useEffect(() => {
    if (arSceneNavigator.viroAppProps.isReady && !isReady) {
      setIsReady(true);
      setTimeout(() => {
        setInitialCarDirection();
      }, 400);
    }
  }, [arSceneNavigator.viroAppProps.isReady, isReady, setInitialCarDirection]);

  const getScanningQuads = useCallback(() => {
    if (isReady) {
      return;
    }

    return (
      <ViroNode
        transformBehaviors="billboardY"
        position={planeReticleLocation}
        scale={[0.5, 0.5, 0.5]}
      >
        <ViroImage
          rotation={[-90, 0, 0]}
          visible={foundPlane}
          source={require('../../assets/models/driving_car/tracking_diffuse_2.png')}
        />
        <ViroImage
          rotation={[-90, 0, 0]}
          visible={!foundPlane}
          source={require('../../assets/models/driving_car/tracking_diffuse.png')}
        />
      </ViroNode>
    );
  }, [foundPlane, isReady, planeReticleLocation]);

  const getCarModel = useCallback(() => {
    const position = isReady ? lastFoundPlaneLocation : [0, 20, 0];

    const transformBehaviors = shouldBillboard ? 'billboardY' : [];

    return (
      <ViroNode
        position={position}
        rotation={modelWorldRotation}
        transformBehaviors={transformBehaviors}
      >
        <ViroNode ref={carRef} scale={[carScale, carScale, carScale]}>
          <ViroAmbientLight
            ref={ambientLightRef}
            color="#f5f8e0"
            intensity={200}
          />

          <ViroQuad
            width={5.691}
            height={5.691}
            materials={['dropShadow']}
            rotation={[-90, 0, 0]}
          />

          <Viro3DObject
            ref={carRotationNodeRef}
            position={[0, 0, 0]}
            source={require('../../assets/models/driving_car/car_body.vrx')}
            type="VRX"
            resources={[
              require('../../assets/models/driving_car/bumblebee_Base_Color.png'),
              require('../../assets/models/driving_car/bumblebee_Metallic.jpg'),
              require('../../assets/models/driving_car/bumblebee_Roughness.jpg'),
              require('../../assets/models/driving_car/bumblebee_Normal_OpenGL.jpg'),
            ]}
          />

          {/* Front left - need 2 containers, 1 for the side-to-side rotation, 1 for spin */}
          <ViroNode
            ref={frontLeftWheelContainerRef}
            position={[-0.61, 0.363, -1.336]}
          >
            <ViroNode ref={frontLeftWheelRef}>
              <Viro3DObject
                source={require('../../assets/models/driving_car/car_wheels.vrx')}
                type="VRX"
                rotation={[0, 180, 0]} // the left wheels need to be rotated 180
                resources={[
                  require('../../assets/models/driving_car/wheels_Base_Color.jpg'),
                  require('../../assets/models/driving_car/wheels_Metallic.jpg'),
                  require('../../assets/models/driving_car/wheels_Roughness.jpg'),
                  require('../../assets/models/driving_car/wheels_Normal_OpenGL.jpg'),
                ]}
              />
            </ViroNode>
          </ViroNode>

          {/* Front right - need 2 containers, 1 for the side-to-side rotation, 1 for spin */}
          <ViroNode
            ref={frontRightWheelContainerRef}
            position={[0.61, 0.363, -1.336]}
          >
            <ViroNode ref={frontRightWheelRef}>
              <Viro3DObject
                source={require('../../assets/models/driving_car/car_wheels.vrx')}
                type="VRX"
                resources={[
                  require('../../assets/models/driving_car/wheels_Base_Color.jpg'),
                  require('../../assets/models/driving_car/wheels_Metallic.jpg'),
                  require('../../assets/models/driving_car/wheels_Roughness.jpg'),
                  require('../../assets/models/driving_car/wheels_Normal_OpenGL.jpg'),
                ]}
              />
            </ViroNode>
          </ViroNode>

          {/* Rear left */}
          <ViroNode ref={rearLeftWheelRef} position={[-0.61, 0.363, 1.355]}>
            <Viro3DObject
              source={require('../../assets/models/driving_car/car_wheels.vrx')}
              type="VRX"
              rotation={[0, 180, 0]} // the left wheels need to be rotated 180
              resources={[
                require('../../assets/models/driving_car/wheels_Base_Color.jpg'),
                require('../../assets/models/driving_car/wheels_Metallic.jpg'),
                require('../../assets/models/driving_car/wheels_Roughness.jpg'),
                require('../../assets/models/driving_car/wheels_Normal_OpenGL.jpg'),
              ]}
            />
          </ViroNode>

          {/* Rear right */}
          <ViroNode ref={rearRightWheelRef} position={[0.61, 0.363, 1.355]}>
            <Viro3DObject
              source={require('../../assets/models/driving_car/car_wheels.vrx')}
              type="VRX"
              resources={[
                require('../../assets/models/driving_car/wheels_Base_Color.jpg'),
                require('../../assets/models/driving_car/wheels_Metallic.jpg'),
                require('../../assets/models/driving_car/wheels_Roughness.jpg'),
                require('../../assets/models/driving_car/wheels_Normal_OpenGL.jpg'),
              ]}
            />
          </ViroNode>
        </ViroNode>
      </ViroNode>
    );
  }, [isReady, lastFoundPlaneLocation, modelWorldRotation, shouldBillboard]);

  const onInitialized = useCallback((state, reason) => {
    if (state === ViroConstants.TRACKING_NORMAL) {
      setText('Hello World!');
    } else if (state === ViroConstants.TRACKING_NONE) {
      // Handle loss of tracking
    }
  }, []);

  const onCameraARHitTest = useCallback(
    results => {
      if (results.hitTestResults.length > 0) {
        for (let i = 0; i < results.hitTestResults.length; i += 1) {
          const result = results.hitTestResults[i];
          if (result.type === 'ExistingPlaneUsingExtent') {
            setPlaneReticleLocation(result.transform.position);
            setDisplayHitReticle(true);
            setFoundPlane(true);
            setLastFoundPlaneLocation(result.transform.position);
            arSceneNavigator.viroAppProps.setIsOverPlaneState(true);
            return;
          }
        }
      }

      // else we made it here, so just forward vector with unmarked.
      const newPosition = [
        results.cameraOrientation.forward[0] * 1.5,
        results.cameraOrientation.forward[1] * 1.5,
        results.cameraOrientation.forward[2] * 1.5,
      ];
      newPosition[0] = results.cameraOrientation.position[0] + newPosition[0];
      newPosition[1] = results.cameraOrientation.position[1] + newPosition[1];
      newPosition[2] = results.cameraOrientation.position[2] + newPosition[2];

      setPlaneReticleLocation(newPosition);
      setDisplayHitReticle(true);
      setFoundPlane(false);

      arSceneNavigator.viroAppProps.setIsOverPlaneState(false);
    },
    [arSceneNavigator.viroAppProps],
  );

  const resetCarValues = useCallback(() => {
    currentAcceleration = 0; // m/s/s
    currentVelocity = 0; // m/s
    currentPosition = [0, 0, 0];
    currentDirection = [0, 0, -1];
    currentRotation = 0; // this is a rotation about the Y in radians...

    carRef.current.setNativeProps({
      position: currentPosition,
      rotation: [0, 0, 0],
    });
  }, []);

  const resetCar = useCallback(() => {
    sceneRef.current.getCameraOrientationAsync().then((orientation: any) => {
      const { position } = orientation;
      const { forward } = orientation;
      const xzMagnitude = Math.sqrt(
        forward[0] * forward[0] + forward[2] * forward[2],
      );

      const distanceFromUser = 1; // meters
      const newPosition = [
        position[0] + (forward[0] / xzMagnitude) * distanceFromUser,
        lastFoundPlaneLocation[1], // we want to use the current Y position!
        position[2] + (forward[2] / xzMagnitude) * distanceFromUser,
      ];

      resetCarValues();

      setLastFoundPlaneLocation(newPosition);
    });
  }, [lastFoundPlaneLocation, resetCarValues]);

  useEffect(() => {
    const resetValue = arSceneNavigator.viroAppProps.shouldResetCar;
    if (resetValue && shouldResetCarValue !== resetValue) {
      setTimeout(() => {
        resetCar();
      }, 50);
    }
    shouldResetCarValue = resetValue;
  }, [arSceneNavigator.viroAppProps.shouldResetCar, resetCar]);

  return (
    <ViroARScene
      ref={sceneRef}
      onCameraARHitTest={isReady ? undefined : onCameraARHitTest}
      onTrackingUpdated={onInitialized}
      physicsWorld={{ gravity: [0, -5, 0] }}
    >
      <ViroLightingEnvironment
        source={require('../../assets/models/driving_car/learner_park_1k.hdr')}
      />

      {getScanningQuads()}

      {getCarModel()}

      <ViroSound
        source={require('../../assets/models/driving_car/car_ambient.mp3')}
        paused={!isReady}
        loop
      />
      <ViroSound
        source={require('../../assets/models/driving_car/car_drive.mp3')}
        paused={!isReady || !(arSceneNavigator.viroAppProps.direction & 10)}
        loop
      />
      <ViroSound
        source={require('../../assets/models/driving_car/car_idle.mp3')}
        paused={!isReady || !(arSceneNavigator.viroAppProps.direction & 10)}
        loop
        volume={volumeLevel}
      />
    </ViroARScene>
  );
};

ViroMaterials.createMaterials({
  dropShadow: {
    diffuseTexture: require('../../assets/models/driving_car/car_shadow.png'),
    lightingModel: 'Constant',
    blendMode: 'Subtract',
  },
  invisibleMaterial: {
    diffuseColor: '#ffffff00',
  },
});

export default ARScene;
