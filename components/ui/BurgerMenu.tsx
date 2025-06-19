import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Dimensions, Image } from 'react-native';
import Svg, { G, Path, Defs, Filter, FeFlood, FeBlend, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite } from 'react-native-svg';
import GoldButton from './GoldButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BurgerMenu = ({ onNavigate }: { onNavigate: (route: string) => void }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Бургер-иконка только когда меню закрыто */}
      {!visible && (
        <View style={styles.menuContainer} pointerEvents="box-none">
          <TouchableOpacity style={styles.burgerWrap} onPress={() => setVisible(true)}>
            <View style={[styles.burgerLine, { backgroundColor: '#f1af07' }]} />
            <View style={[styles.burgerLine, { backgroundColor: '#fdea35' }]} />
            <View style={[styles.burgerLine, { backgroundColor: '#f1af07' }]} />
          </TouchableOpacity>
          {/* PNG рамка */}
          <Image
            source={require('../../assets/images/menu-container.png')}
            style={styles.pngFrame}
            resizeMode="stretch"
          />
        </View>
      )}
      {/* Модальное меню */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.menuModal}>
            <GoldButton title="Home" onPress={() => { setVisible(false); onNavigate('home'); }} />
            <GoldButton title="Campaigns" onPress={() => { setVisible(false); onNavigate('available-qwests'); }} style={{ marginTop: 12 }} />
            <GoldButton title="Profile" onPress={() => { setVisible(false); onNavigate('profile'); }} style={{ marginTop: 12 }} />
            <GoldButton title="Rewards" onPress={() => { setVisible(false); onNavigate('rewards'); }} style={{ marginTop: 12 }} />
            <GoldButton title="My Qwests" onPress={() => { setVisible(false); onNavigate('my-qwests'); }} style={{ marginTop: 12 }} />
          </View>
          {/* Крестик внутри модального окна */}
          <View style={styles.modalBurgerWrap}>
            <TouchableOpacity style={styles.burgerWrap} onPress={() => setVisible(false)}>
              <View
                style={[styles.burgerLine, {
                  backgroundColor: '#f1af07',
                  transform: [
                    { translateY: 15 },
                    { rotate: '45deg' }
                  ],
                }]}
              />
              <View
                style={[styles.burgerLine, {
                  backgroundColor: '#fdea35',
                  opacity: 0,
                }]}
              />
              <View
                style={[styles.burgerLine, {
                  backgroundColor: '#f1af07',
                  transform: [
                    { translateY: -11 },
                    { rotate: '-45deg' }
                  ],
                }]}
              />
            </TouchableOpacity>
            {/* PNG рамка */}
            <Image
              source={require('../../assets/images/menu-container.png')}
              style={styles.pngFrame}
              resizeMode="stretch"
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1000,
  },
  pngFrame: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: 80,
    zIndex: 1,
  },
  burgerWrap: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'transparent',
    borderRadius: 22,
  },
  burgerLine: {
    width: 36,
    height: 3,
    borderRadius: 2.5,
    marginVertical: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    //backgroundColor: '#131317',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: 300,
    elevation: 10,
  },
  modalBurgerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 9999,
  },
});

export default BurgerMenu; 