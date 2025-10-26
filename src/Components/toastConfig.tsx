import React from 'react';
import { useEffect, useRef } from 'react';
import {
  Text,
  View,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface ToastComponentProps extends BaseToastProps {
  color: string;
  type: 'success' | 'error' | 'info';
}

const ToastComponent: React.FC<ToastComponentProps> = ({
  text1,
  text2,
  color,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          width: width - 12,
        },
      ]}
    >
      <View
        style={{
          width: 4,
          height: '80%',
          backgroundColor: color,
          borderRadius: 4,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { marginBottom: text2 ? 4 : 0 }]}>
          {text1}
        </Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </Animated.View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastComponent {...props} color="#007AFF" type="success" />
  ),
  error: (props: BaseToastProps) => (
    <ToastComponent {...props} color="#F44336" type="error" />
  ),
  info: (props: BaseToastProps) => (
    <ToastComponent {...props} color="#2196F3" type="info" />
  ),
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 6,
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  } as ViewStyle,
  title: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  } as TextStyle,
  message: {
    color: '#666',
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: 18,
  } as TextStyle,
});

export default ToastComponent;