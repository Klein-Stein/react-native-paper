import * as React from 'react';
import { View, Image, Dimensions, StyleSheet, Platform } from 'react-native';
import { Navbar } from 'react-native-paper';
import ScreenWrapper from '../ScreenWrapper';

type RoutesState = Array<{
  key: string;
  title: string;
  icon: string;
  color?: string;
  badge?: boolean;
  getAccessibilityLabel?: string;
  getTestID?: string;
}>;

type Route = { route: { key: string } };

const PhotoGallery = ({ route }: Route) => {
  const PHOTOS = Array.from({ length: 24 }).map(
    (_, i) => `https://unsplash.it/300/300/?random&__id=${route.key}${i}`
  );

  return (
    <ScreenWrapper contentContainerStyle={styles.content}>
      {PHOTOS.map((uri) => (
        <View key={uri} style={styles.item}>
          <Image source={{ uri }} style={styles.photo} />
        </View>
      ))}
    </ScreenWrapper>
  );
};

const NavbarExample = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState<RoutesState>([
    { key: 'album', title: 'Album', icon: 'image-album', color: '#6200ee' },
    {
      key: 'library',
      title: 'Library',
      icon: 'inbox',
      color: '#2962ff',
      badge: true,
    },
    {
      key: 'favorites',
      title: 'Favorites',
      icon: 'heart',
      color: '#00796b',
    },
    {
      key: 'purchased',
      title: 'Purchased',
      icon: 'shopping-music',
      color: '#c51162',
    },
  ]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const onChangeSearch = (query: React.SetStateAction<string>) => {
    setSearchQuery(query);
  };

  return (
    <Navbar
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={Navbar.SceneMap({
        album: PhotoGallery,
        library: PhotoGallery,
        favorites: PhotoGallery,
        purchased: PhotoGallery,
      })}
    >
      <Navbar.Content title="Navbar" />
      <Navbar.Search
        placeholder="Search..."
        value={searchQuery}
        onChangeText={onChangeSearch}
      />
    </Navbar>
  );
};

NavbarExample.title = 'Navbar';

export default NavbarExample;

const styles = StyleSheet.create({
  ...Platform.select({
    web: {
      content: {
        // there is no 'grid' type in RN :(
        display: 'grid' as 'none',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gridRowGap: '8px',
        gridColumnGap: '8px',
        padding: 8,
      },
      item: {
        width: '100%',
        height: 150,
      },
    },
    default: {
      content: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 4,
      },
      item: {
        height: Dimensions.get('window').width / 2,
        width: '50%',
        padding: 4,
      },
    },
  }),
  photo: {
    flex: 1,
    resizeMode: 'cover',
  },
});
