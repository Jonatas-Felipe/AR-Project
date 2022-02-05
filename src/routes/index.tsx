import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from '../pages/Home';
import ARHitTestSample from '../pages/ARHitTestSample';
import ARPosterDemo from '../pages/ARPosterDemo';
import ARDrivingCarDemo from '../pages/ARDrivingCarDemo';

const Stack = createNativeStackNavigator();

const routes: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ARHitTestSample" component={ARHitTestSample} />
      <Stack.Screen name="ARPosterDemo" component={ARPosterDemo} />
      <Stack.Screen name="ARDrivingCarDemo" component={ARDrivingCarDemo} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default routes;
