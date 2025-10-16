import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../app';

describe('App', () => {
  it('renders the sign-in experience when unauthenticated', async () => {
    const { findByText } = render(<App />);
    const prompt = await findByText(/Sign in with a magic link/i);
    expect(prompt).toBeTruthy();
  });
});
