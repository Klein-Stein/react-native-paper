import { default as NavbarComponent } from './Navbar';
import NavbarContent from './NavbarContent';
import NavbarSearch from './NavbarSearch';

const Navbar = Object.assign(
  // @component ./Navbar.tsx
  NavbarComponent,
  {
    // @component ./NavbarContent.tsx
    Content: NavbarContent,
    // @component ./NavbarContent.tsx
    Search: NavbarSearch,
    // @component ./Navbar.tsx
    SceneMap: NavbarComponent.SceneMap,
  }
);

export default Navbar;
