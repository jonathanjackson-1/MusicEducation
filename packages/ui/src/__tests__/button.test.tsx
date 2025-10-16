import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../components/button';

describe('Button', () => {
  it('renders with label', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole('button', { name: /click me/i })).toBeDefined();
  });
});
