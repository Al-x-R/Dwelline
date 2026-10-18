import { resolveIsPro } from './proStore';

jest.mock('@react-native-async-storage/async-storage', () => ({getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()}));

describe('resolveIsPro', () => {
  it('follows the purchase in release builds, whatever the dev switch says', () => {
    expect(resolveIsPro(true, 'free', false)).toBe(true);
    expect(resolveIsPro(false, 'pro', false)).toBe(false);
  });

  it('follows the dev switch in development builds', () => {
    expect(resolveIsPro(false, 'pro', true)).toBe(true);
    expect(resolveIsPro(true, 'free', true)).toBe(false);
  });
});
