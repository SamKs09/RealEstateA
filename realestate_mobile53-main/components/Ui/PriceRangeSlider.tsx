import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH * 0.7;
const THUMB_SIZE = 24;

interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minValue = 0,
  maxValue = 500000,
  step = 1000,
}) => {
  const minPercentage = ((minPrice - minValue) / (maxValue - minValue)) * 100;
  const maxPercentage = ((maxPrice - minValue) / (maxValue - minValue)) * 100;

  const handleMinChange = (newMin: number) => {
    if (newMin <= maxPrice) {
      onMinPriceChange(newMin);
    }
  };

  const handleMaxChange = (newMax: number) => {
    if (newMax >= minPrice) {
      onMaxPriceChange(newMax);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sliderTrack}>
        {/* Range highlight */}
        <View
          style={[
            styles.rangeHighlight,
            {
              left: `${minPercentage}%`,
              right: `${100 - maxPercentage}%`,
            },
          ]}
        />

        {/* Min thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: `${minPercentage}%`,
              marginLeft: -THUMB_SIZE / 2,
            },
          ]}
        >
          <View style={styles.thumbInner} />
        </Animated.View>

        {/* Max thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: `${maxPercentage}%`,
              marginLeft: -THUMB_SIZE / 2,
            },
          ]}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      <View style={styles.labelsContainer}>
        <Text style={styles.priceLabel}>
          ${minPrice.toLocaleString()}
        </Text>
        <Text style={styles.priceLabel}>
          ${maxPrice.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    marginVertical: 16,
  },
  sliderTrack: {
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  rangeHighlight: {
    position: "absolute",
    height: 6,
    backgroundColor: "#FF6B35",
    borderRadius: 3,
    top: 17,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  priceLabel: {
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
  },
});
