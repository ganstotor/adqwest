import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { IconSymbol, IconSymbolName } from './IconSymbol';
import { ACCENT1_DARK, ACCENT2_LIGHT } from '../../constants/Colors';

interface MenuItem {
  key: string;
  label: string;
  icon: IconSymbolName;
  active?: boolean;
  onPress?: () => void;
}

interface MenuProps {
  items: MenuItem[];
}

const Menu: React.FC<MenuProps> = ({ items }) => {
  return (
    <View style={styles.menuContainer}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.menuItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={item.icon}
            size={28}
            active={item.active}
          />
          <Text style={[styles.menuLabel, item.active && styles.menuLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  menuLabel: {
    marginTop: 4,
    color: ACCENT1_DARK,
    fontSize: 12,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: ACCENT2_LIGHT,
  },
});

export default Menu; 