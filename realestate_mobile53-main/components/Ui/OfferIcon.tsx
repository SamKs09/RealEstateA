// Placeholder icon for offers tab. Replace with a better icon if available.
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function OfferIcon({ color = '#A0A0A0' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12l7-7 7 7-7 7-7-7z" stroke={color} strokeWidth={2} fill="none"/>
      <Path d="M12 3v18" stroke={color} strokeWidth={2} fill="none"/>
    </Svg>
  );
}
