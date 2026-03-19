# Welcome to Project Haven

Please use the dev (development) branch for all commits

This project IS open-sourced, however it will likely not remain as such.

# TO DEPLOY:


### Web Device: 
Simply deploy by running npx expo start. Currently, the app version is a little shaky. We're relying on the web version.
To deploy the web version, run `npx expo start --web`

You may need to install dependencies. Do so using: `npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context`

### Mobile Device:

Upon running `npx expo start` (without the `--web`), a QR code should appear in your `terminal`. 
Simply scan this QR code. Make sure that you have Expo Go's mobile app installed with a Supported SDK 54 (NOT 55!).