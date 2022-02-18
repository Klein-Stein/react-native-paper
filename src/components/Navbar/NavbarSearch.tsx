import React from 'react';
import { StyleSheet } from 'react-native';
import Searchbar from '../Searchbar';

type NavbarSearchProps = React.ComponentProps<typeof Searchbar> & {
  theme?: {
    colors: {
      background: string;
    };
  };
};

const NavbarSearch: React.FC<NavbarSearchProps> = (
  props: NavbarSearchProps
) => {
  const backgroundColor = props.theme?.colors.background ?? '#ffffff';
  const styles = StyleSheet.create({
    searchbar: {
      elevation: 0,
      backgroundColor: backgroundColor,
      borderRadius: 8,
      height: 32,
    },
  });
  return <Searchbar style={styles.searchbar} {...props} />;
};

export default NavbarSearch;
