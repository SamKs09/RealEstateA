import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { PopupMessage } from '../components/Ui/PopupMessage';

type PopupType = 'error' | 'success' | 'info' | 'confirm';

interface PopupAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface PopupOptions {
  title?: string;
  primaryAction?: PopupAction;
  secondaryAction?: PopupAction;
  autoCloseMs?: number;
}

interface PopupContextType {
  showPopup: (type: PopupType, message: string, options?: PopupOptions) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirm: (title: string, message: string, options?: Omit<PopupOptions, 'title' | 'autoCloseMs'>) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<PopupType>('error');
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [primaryAction, setPrimaryAction] = useState<PopupAction | undefined>(undefined);
  const [secondaryAction, setSecondaryAction] = useState<PopupAction | undefined>(undefined);
  const timeoutRef = useRef<any>(null);

  const showPopup = useCallback((newType: PopupType, newMessage: string, options?: PopupOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setType(newType);
    setTitle(options?.title);
    setMessage(newMessage);
    setPrimaryAction(options?.primaryAction);
    setSecondaryAction(options?.secondaryAction);
    setVisible(true);

    if (newType !== 'confirm') {
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, options?.autoCloseMs ?? 3000);
    }
  }, []);

  const showError = useCallback((msg: string, popupTitle?: string) => {
    showPopup('error', msg, { title: popupTitle });
  }, [showPopup]);

  const showSuccess = useCallback((msg: string, popupTitle?: string) => {
    showPopup('success', msg, { title: popupTitle });
  }, [showPopup]);

  const showInfo = useCallback((msg: string, popupTitle?: string) => {
    showPopup('info', msg, { title: popupTitle });
  }, [showPopup]);

  const showConfirm = useCallback((popupTitle: string, msg: string, options?: Omit<PopupOptions, 'title' | 'autoCloseMs'>) => {
    showPopup('confirm', msg, {
      title: popupTitle,
      primaryAction: options?.primaryAction,
      secondaryAction: options?.secondaryAction,
    });
  }, [showPopup]);

  const closePopup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
    setPrimaryAction(undefined);
    setSecondaryAction(undefined);
  }, []);

  return (
    <PopupContext.Provider value={{ showPopup, showError, showSuccess, showInfo, showConfirm }}>
      {children}
      <PopupMessage
        visible={visible}
        type={type}
        title={title}
        message={message}
        onClose={closePopup}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
