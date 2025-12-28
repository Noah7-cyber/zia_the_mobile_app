import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions 
} from 'react-native';
import { CheckIcon } from './Icons';

export interface ToastMessage {
  id: number;
  message: string;
  type?: 'success' | 'error';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Exit Animation
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose(toast.id));
  };

  return (
    <Animated.View style={[
      styles.toastWrapper, 
      { opacity, transform: [{ translateY }] }
    ]}>
      <TouchableOpacity 
        style={styles.toastInner} 
        onPress={handleClose}
        activeOpacity={0.9}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }
        ]}>
           <CheckIcon 
             size={16} 
             color={toast.type === 'error' ? '#f87171' : '#34d399'} 
           />
        </View>
        <Text style={styles.toastText}>{toast.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Adjusted for mobile bottom nav height
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 10,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a', // slate-900
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)', // slate-700/50
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.2,
    flex: 1,
  },
});