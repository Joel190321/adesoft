import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CircleUserRound } from 'lucide-react-native';

interface ThemedInputProps extends TextInputProps {
  icon?: boolean;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({ icon, style, ...props }) => {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const backgroundColor = useThemeColor({}, 'background');
  const [inputWrapperWidth, setInputWrapperWidth] = React.useState(() => {
    const w = Dimensions.get('window').width;
    if (w > 1000) return '20%';
    if (w > 850) return '30%';
    if (w > 450) return '50%';
    return '90%';
  });

  React.useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => {
      if (window.width > 1000) setInputWrapperWidth('20%');
      else if (window.width > 850) setInputWrapperWidth('30%');
      else if (window.width > 450) setInputWrapperWidth('50%');
      else setInputWrapperWidth('90%');
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription?.remove?.();
    };
  }, []);

  return (
    <View style={[styles.inputWrapper, { width: inputWrapperWidth as any }, style]}> 
      <TextInput
        {...props}
        style={[
          styles.input,
          { color: textColor, backgroundColor, borderColor: textColor },
          style,
        ]}
        placeholderTextColor={placeholderColor}
      />
      {icon && (
        <CircleUserRound size={24} color={textColor} style={styles.inputIcon} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'center',
    borderRadius: 5,
  },
  input: {
    width: '100%',
    padding: 10,
    paddingRight: 40,
    borderWidth: 2,
    borderRadius: 30,
    fontSize: 16,
  },
  inputIcon: {
    position: 'absolute',
    right: 10,
    top: '24%',
  },
});
