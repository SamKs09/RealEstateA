import React from "react";
import { PopupMessage } from "./PopupMessage";

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title = "Success",
  message,
  onClose,
  buttonText = "OK",
}) => {
  return (
    <PopupMessage
      visible={visible}
      type="success"
      title={title}
      message={message}
      onClose={onClose}
      primaryAction={{ text: buttonText, onPress: onClose }}
    />
  );
};
