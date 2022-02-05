import React, { useCallback } from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Container, Button } from './styles';

const Home: React.FC = () => {
  const navigation = useNavigation();
  const handlePress = useCallback(
    page => {
      navigation.navigate(page);
    },
    [navigation],
  );

  return (
    <Container>
      <Button onPress={() => handlePress('ARHitTestSample')}>
        <Text style={{ textAlign: 'center' }}>ARHitTestSample</Text>
      </Button>
      <Button onPress={() => handlePress('ARPosterDemo')}>
        <Text style={{ textAlign: 'center' }}>ARPosterDemo</Text>
      </Button>
      <Button onPress={() => handlePress('ARDrivingCarDemo')}>
        <Text style={{ textAlign: 'center' }}>ARDrivingCarDemo</Text>
      </Button>
    </Container>
  );
};

export default Home;
