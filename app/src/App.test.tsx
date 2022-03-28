import React from 'react';
import { render, screen } from '@testing-library/react';
import AppRoom from './AppRoom';

test('renders learn react link', () => {
  render(<AppRoom />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
