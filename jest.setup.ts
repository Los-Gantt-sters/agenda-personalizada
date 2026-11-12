// Mocks globales de módulos nativos que no existen en Jest (T-01.3 · SCRUM-52).
// expo-audio: reproductor falso para poder probar los componentes que suenan.
jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(() => ({
    volume: 1,
    play: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  })),
}));

// AsyncStorage: almacenamiento en memoria que trae la propia librería
jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock no admite import
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
