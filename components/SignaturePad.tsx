import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { TrashIcon, CheckIcon, SaveIcon, EditIcon } from './Icons';

interface Props {
  value: string; // Base64 string
  onChange: (value: string) => void;
  themeColor: string;
}

export const SignaturePad: React.FC<Props> = ({ value, onChange, themeColor }) => {
  const ref = useRef<SignatureViewRef>(null);
  const [isLocked, setIsLocked] = useState(!!value);

  // Called when the user finishes drawing and clicks the internal 'save' logic
  const handleOK = (signature: string) => {
    onChange(signature);
    setIsLocked(true);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    onChange('');
    setIsLocked(false);
  };

  const handleConfirm = () => {
    ref.current?.readSignature(); // This triggers handleOK
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.padWrapper, 
        { borderColor: isLocked ? '#ecfdf5' : '#e2e8f0' },
        isLocked && styles.lockedBg
      ]}>
        
        {isLocked && value ? (
          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: value }} 
              style={styles.previewImage} 
              resizeMode="contain" 
            />
            <View style={styles.finalizedBadge}>
              <CheckIcon size={12} color="#10b981" />
              <Text style={styles.finalizedText}>Finalized</Text>
            </View>
          </View>
        ) : (
          <View style={styles.canvasHeight}>
            <SignatureScreen
              ref={ref}
              onOK={handleOK}
              descriptionText="Sign Here"
              clearText="Clear"
              confirmText="Save"
              webStyle={webStyle(themeColor)}
              autoClear={false}
              imageType="image/png"
            />
          </View>
        )}

        {!value && !isLocked && (
          <View style={styles.placeholder} pointerEvents="none">
            <EditIcon size={24} color="#cbd5e1" />
            <Text style={styles.placeholderText}>Authorized Seal Required</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {!isLocked && (
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[styles.btn, { backgroundColor: '#0f172a' }]}
          >
            <SaveIcon size={14} color="white" />
            <Text style={styles.btnText}>Lock & Save</Text>
          </TouchableOpacity>
        )}

        {isLocked && (
          <TouchableOpacity 
            onPress={() => setIsLocked(false)} 
            style={[styles.btn, styles.unlockBtn]}
          >
            <EditIcon size={14} color="#64748b" />
            <Text style={[styles.btnText, { color: '#64748b' }]}>Unlock Signature</Text>
          </TouchableOpacity>
        )}

        {!isLocked && (
          <TouchableOpacity onPress={handleClear} style={styles.resetBtn}>
            <TrashIcon size={14} color="#ef4444" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Custom CSS for the underlying WebView signature component
const webStyle = (color: string) => `
  .m-signature-pad { box-shadow: none; border: none; } 
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body,html { height: 160px; }
`;



const styles = StyleSheet.create({
  container: { width: '100%' },
  padWrapper: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    minHeight: 160,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  lockedBg: {
    borderStyle: 'solid',
    backgroundColor: '#f0fdf4',
  },
  canvasHeight: { height: 160 },
  previewContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 100,
  },
  finalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
    marginTop: 10,
    gap: 6
  },
  finalizedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  unlockBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
  },
  resetText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
  }
});