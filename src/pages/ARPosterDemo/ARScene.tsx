import React, { useCallback, useState } from 'react';

import {
  ViroARScene,
  ViroQuad,
  ViroNode,
  ViroOmniLight,
  ViroARTrackingTargets,
  ViroARImageMarker,
  ViroAnimations,
  Viro3DObject,
  ViroSpotLight,
  ViroAmbientLight,
} from '@viro-community/react-viro';

const ARScene: React.FC = () => {
  const [loopState, setLoopState] = useState(false);
  const [animationName, setAnimationName] = useState('01');
  const [pauseUpdates, setPauseUpdates] = useState(false);
  const [playAnim, setPlayAnim] = useState(true);
  const [modelAnim, setModelAnim] = useState(true);

  const onFinish = useCallback(() => {
    setAnimationName('02');
    setLoopState(true);
  }, []);

  const onAnchorFound = useCallback(() => {
    setPauseUpdates(true);
    setPlayAnim(true);
    setModelAnim(true);
  }, []);

  const onModelLoad = useCallback(() => {
    setTimeout(() => {
      // this.setState({});;
    }, 3000);
  }, []);

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={200} />

      <ViroARImageMarker
        target="poster"
        onAnchorFound={onAnchorFound}
        pauseUpdates={pauseUpdates}
      >
        <ViroNode
          position={[0, -0.1, 0]}
          scale={[0, 0, 0]}
          rotation={[-90, 0, 0]}
          dragType="FixedToWorld"
          onDrag={() => {
            console.log('drag');
          }}
          animation={{ name: 'scaleModel', run: playAnim }}
        >
          <Viro3DObject
            onLoadEnd={onModelLoad}
            source={require('../../assets/models/blackpanther/object_bpanther_anim.vrx')}
            resources={[
              require('../../assets/models/blackpanther/object_bpanther_Base_Color.png'),
              require('../../assets/models/blackpanther/object_bpanther_Metallic.png'),
              require('../../assets/models/blackpanther/object_bpanther_Mixed_AO.png'),
              require('../../assets/models/blackpanther/object_bpanther_Normal_OpenGL.png'),
              require('../../assets/models/blackpanther/object_bpanther_Roughness.png'),
            ]}
            position={[0, -1.45, 0]}
            scale={[0.9, 0.9, 0.9]}
            animation={{
              name: animationName,
              run: modelAnim,
              loop: loopState,
              onFinish,
            }}
            type="VRX"
          />
        </ViroNode>
      </ViroARImageMarker>

      <ViroOmniLight
        intensity={300}
        position={[-10, 10, 1]}
        color="#FFFFFF"
        attenuationStartDistance={20}
        attenuationEndDistance={30}
      />

      <ViroOmniLight
        intensity={300}
        position={[10, 10, 1]}
        color="#FFFFFF"
        attenuationStartDistance={20}
        attenuationEndDistance={30}
      />

      <ViroOmniLight
        intensity={300}
        position={[-10, -10, 1]}
        color="#FFFFFF"
        attenuationStartDistance={20}
        attenuationEndDistance={30}
      />

      <ViroOmniLight
        intensity={300}
        position={[10, -10, 1]}
        color="#FFFFFF"
        attenuationStartDistance={20}
        attenuationEndDistance={30}
      />

      <ViroSpotLight
        position={[0, 8, -2]}
        color="#ffffff"
        direction={[0, -1, 0]}
        intensity={50}
        attenuationStartDistance={5}
        attenuationEndDistance={10}
        innerAngle={5}
        outerAngle={20}
        castsShadow
      />

      <ViroQuad
        rotation={[-90, 0, 0]}
        position={[0, -1.6, 0]}
        width={5}
        height={5}
        arShadowReceiver
      />
    </ViroARScene>
  );
};

ViroARTrackingTargets.createTargets({
  poster: {
    source: require('../../assets/defaults/blackpanther.jpg'),
    orientation: 'Up',
    physicalWidth: 0.6096, // real world width in meters
  },
});

ViroAnimations.registerAnimations({
  scaleModel: {
    properties: { scaleX: 1, scaleY: 1, scaleZ: 1 },
    duration: 1000,
  },
});

export default ARScene;
