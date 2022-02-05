import React, { useCallback, useState, useRef } from 'react';

import {
  ViroARScene,
  ViroAmbientLight,
  ViroNode,
  ViroQuad,
  ViroSpotLight,
  Viro3DObject,
} from '@viro-community/react-viro';

interface IARScene {
  arSceneNavigator: any;
}

const ARScene: React.FC<IARScene> = ({ arSceneNavigator }) => {
  const viroARSceneRef = useRef<any>(null);
  const arNodeRef = useRef<any>(null);
  const spotLightRef = useRef<any>(null);
  const [objPosition, setObjPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState([0.2, 0.2, 0.2]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [shouldBillboard, setShouldBillboard] = useState(true);

  /*
  Rotation should be relative to its current rotation *not* set to the absolute
  value of the given rotationFactor.
  */
  const onRotate = useCallback(
    (rotateState, rotationFactor) => {
      if (rotateState === 3) {
        setRotation([rotation[0], rotation[1] + rotationFactor, rotation[2]]);
        return;
      }

      arNodeRef.current.setNativeProps({
        rotation: [rotation[0], rotation[1] + rotationFactor, rotation[2]],
      });
    },
    [rotation],
  );

  /*
  Pinch scaling should be relative to its last value *not* the absolute value of the
  scale factor. So while the pinching is ongoing set scale through setNativeProps
  and multiply the state by that factor. At the end of a pinch event, set the state
  to the final value and store it in state.
  */
  const onPinch = useCallback(
    (pinchState, scaleFactor) => {
      const newScale = scale.map(x => x * scaleFactor);

      if (pinchState === 3) {
        setScale(newScale);
        return;
      }

      arNodeRef.current.setNativeProps({ scale: newScale });
      spotLightRef.current.setNativeProps({ shadowFarZ: 6 * newScale[0] });
    },
    [scale],
  );

  const onLoadStart = useCallback(() => {
    setShouldBillboard(true);
    arSceneNavigator.viroAppProps.onLoadStart();
  }, [arSceneNavigator]);

  // Calculate distance between two vectors
  const distance = useCallback((vectorOne, vectorTwo) => {
    const distanceData = Math.sqrt(
      (vectorTwo[0] - vectorOne[0]) * (vectorTwo[0] - vectorOne[0]) +
        (vectorTwo[1] - vectorOne[1]) * (vectorTwo[1] - vectorOne[1]) +
        (vectorTwo[2] - vectorOne[2]) * (vectorTwo[2] - vectorOne[2]),
    );
    return distanceData;
  }, []);

  // Update the rotation of the object to face the user after it's positioned.
  const updateInitialRotation = useCallback(() => {
    arNodeRef.current.getTransformAsync().then((retDict: any) => {
      const rotationData = retDict.rotation;
      const absX = Math.abs(rotationData[0]);
      const absZ = Math.abs(rotationData[2]);

      let yRotation = rotationData[1];

      // If the X and Z aren't 0, then adjust the y rotation.
      if (absX > 1 && absZ > 1) {
        yRotation = 180 - yRotation;
      }

      setRotation([0, yRotation, 0]);
      setShouldBillboard(false);
    });
  }, []);

  const setInitialPlacement = useCallback(
    position => {
      setObjPosition(position);
      setTimeout(() => {
        updateInitialRotation();
      }, 200);
    },
    [updateInitialRotation],
  );

  const onArHitTestResults = useCallback(
    (position, forward, results) => {
      // Default position is just 1.5 meters in front of the user.
      let newPosition = [forward[0] * 1.5, forward[1] * 1.5, forward[2] * 1.5];
      let hitResultPosition;

      // Filter the hit test results based on the position.
      if (results.length > 0) {
        for (let i = 0; i < results.length; i += 1) {
          const result = results[i];
          if (result.type === 'ExistingPlaneUsingExtent') {
            const distanceData = Math.sqrt(
              (result.transform.position[0] - position[0]) *
                (result.transform.position[0] - position[0]) +
                (result.transform.position[1] - position[1]) *
                  (result.transform.position[1] - position[1]) +
                (result.transform.position[2] - position[2]) *
                  (result.transform.position[2] - position[2]),
            );
            if (distanceData > 0.2 && distanceData < 10) {
              // If we found a plane greater than .2 and less than 10 meters away then choose it!
              hitResultPosition = result.transform.position;
              break;
            }
          } else if (result.type === 'FeaturePoint' && !hitResultPosition) {
            // If we haven't found a plane and this feature point is within range, then we'll use it
            // as the initial display point.
            const distanceData = distance(position, result.transform.position);
            if (distanceData > 0.2 && distanceData < 10) {
              hitResultPosition = result.transform.position;
            }
          }
        }
      }

      if (hitResultPosition) {
        newPosition = hitResultPosition;
      }

      // Set the initial placement of the object using new position from the hit test.
      setInitialPlacement(newPosition);
    },
    [distance, setInitialPlacement],
  );

  // Perform a hit test on load end to display object.
  const onLoadEnd = useCallback(() => {
    viroARSceneRef.current
      .getCameraOrientationAsync()
      .then((orientation: any) => {
        viroARSceneRef.current
          .performARHitTestWithRay(orientation.forward)
          .then((results: any) => {
            onArHitTestResults(
              orientation.position,
              orientation.forward,
              results,
            );
          });
      });
    arSceneNavigator.viroAppProps.onLoadEnd();
  }, [onArHitTestResults, arSceneNavigator]);

  const getModel = useCallback(() => {
    const modelArray = [];
    if (
      !arSceneNavigator.viroAppProps.displayObject ||
      arSceneNavigator.viroAppProps.displayObjectName === undefined
    ) {
      return;
    }

    const transformBehaviors: any = {};
    if (shouldBillboard) {
      transformBehaviors.transformBehaviors = shouldBillboard
        ? 'billboardY'
        : [];
    }

    modelArray.push(
      <ViroNode
        {...transformBehaviors}
        visible={arSceneNavigator.viroAppProps.displayObject}
        position={objPosition}
        onDrag={() => {
          console.log('drag');
        }}
        ref={arNodeRef}
        scale={scale}
        rotation={rotation}
        dragType="FixedToWorld"
        key={arSceneNavigator.viroAppProps.displayObjectName}
      >
        <ViroSpotLight
          innerAngle={5}
          outerAngle={20}
          direction={[0, -1, 0]}
          position={[0, 4, 0]}
          color="#ffffff"
          castsShadow
          shadowNearZ={0.1}
          shadowFarZ={6}
          shadowOpacity={0.9}
          ref={spotLightRef}
        />

        <Viro3DObject
          position={[0, arSceneNavigator.viroAppProps.yOffset, 0]}
          source={arSceneNavigator.viroAppProps.objectSource}
          type="VRX"
          onLoadEnd={onLoadEnd}
          onLoadStart={onLoadStart}
          onRotate={onRotate}
          onPinch={onPinch}
        />

        <ViroQuad
          rotation={[-90, 0, 0]}
          position={[0, -0.001, 0]}
          width={2.5}
          height={2.5}
          arShadowReceiver
          ignoreEventHandling
        />
      </ViroNode>,
    );

    // eslint-disable-next-line consistent-return
    return modelArray;
  }, [
    objPosition,
    onLoadEnd,
    onLoadStart,
    onPinch,
    onRotate,
    rotation,
    scale,
    shouldBillboard,
    arSceneNavigator,
  ]);

  const onTrackInit = useCallback(() => {
    console.log(arSceneNavigator.viroAppProps);
    arSceneNavigator.viroAppProps.onTrackingInit();
  }, [arSceneNavigator]);

  return (
    <ViroARScene ref={viroARSceneRef} onTrackingUpdated={onTrackInit}>
      <ViroAmbientLight color="#ffffff" intensity={200} />
      {getModel()}
    </ViroARScene>
  );
};

export default ARScene;
