import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';

const MapView = forwardRef(function MapViewWeb(
  { style, children }: { style?: any; children?: React.ReactNode },
  ref
) {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    fitToCoordinates: () => {},
    animateCamera: () => {},
  }));

  return <View style={[styles.mapFallback, style]}>{children}</View>;
});

function Marker({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

function Polygon() {
  return null;
}

function Polyline() {
  return null;
}

const styles = StyleSheet.create({
  mapFallback: {
    backgroundColor: '#0f172a',
  },
});

export default MapView;
export { Marker, Polygon, Polyline };
