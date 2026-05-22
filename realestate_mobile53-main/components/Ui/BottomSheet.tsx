import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

interface BottomSheetProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface BottomSheetModalMethods {
  present: () => void;
  dismiss: () => void;
}

export const BottomSheet = forwardRef<BottomSheetModalMethods, BottomSheetProps>(
  ({ title, children, snapPoints, onClose, showCloseButton = true }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // variables
    const defaultSnapPoints = useMemo(() => ["25%", "50%", "75%"], []);
    const resolvedSnapPoints = snapPoints || defaultSnapPoints;

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    // callbacks
    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1 && onClose) {
          onClose();
        }
      },
      [onClose]
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleClosePress = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
    }, []);

    // render
    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={resolvedSnapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.contentContainer}>
          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
              </View>
              {showCloseButton && (
                <TouchableOpacity onPress={handleClosePress} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.body}>{children}</View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  closeButton: {
    padding: 5,
  },
  body: {
    flex: 1,
  },
});

export default BottomSheet;
