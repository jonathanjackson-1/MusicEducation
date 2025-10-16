import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../app';

describe('App', () => {
  it('renders the headline', () => {
    const { getByText } = render(<App />);
    expect(getByText(/Soundstudio Mobile/)).toBeTruthy();
  });
});
