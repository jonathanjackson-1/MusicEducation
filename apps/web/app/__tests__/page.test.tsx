import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('renders hero section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Welcome to Soundstudio/i)).toBeInTheDocument();
  });
});
