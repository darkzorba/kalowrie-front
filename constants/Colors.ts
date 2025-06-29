export const Tints = {
  primary: '#90A4AE',
  lightPrimary: '#CFD8DC',
  darkPrimary: '#607D8B',
};

export const BaseColors = {
  white: '#FFFFFF',
  black: '#000000',
  grey: '#808080',
  lightGrey: '#D3D3D3',
  darkGrey: '#333333',
  error: '#FF3B30',
};

export const LightThemeColors = {
  background: BaseColors.white,
  text: BaseColors.black,
  primary: Tints.primary,
  secondary: Tints.lightPrimary,
  card: '#F5F5F5',
  border: BaseColors.lightGrey,
  inputBackground: '#F0F0F0',
  placeholderText: BaseColors.grey,
  disabled: '#A9A9A9',
  appBackground: '#EFEFF4',
  headerBackground: BaseColors.white,
  headerText: BaseColors.black,
  icon: BaseColors.black,
  tabIconDefault: BaseColors.grey,
  tabIconSelected: Tints.primary,
};

export const DarkThemeColors = {
  background: BaseColors.black,
  text: BaseColors.white,
  primary: Tints.primary,
  secondary: Tints.darkPrimary,
  card: BaseColors.darkGrey,
  border: '#444444',
  inputBackground: '#2C2C2E',
  placeholderText: BaseColors.lightGrey,
  disabled: '#555555',
  appBackground: '#121212',
  headerBackground: BaseColors.black,
  headerText: BaseColors.white,
  icon: BaseColors.white,
  tabIconDefault: BaseColors.lightGrey,
  tabIconSelected: Tints.primary,
};

export type ColorScheme = typeof LightThemeColors;

export default {
  light: LightThemeColors,
  dark: DarkThemeColors,
  common: {
    error: BaseColors.error,
    white: BaseColors.white,
    black: BaseColors.black,
  }
};
