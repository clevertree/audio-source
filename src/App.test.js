import React from 'react';
import { render } from '@testing-library/react';
import IndexRouter from "./server/IndexRouter";

test('renders', () => {
  const { getByText } = render(<IndexRouter />);
  const linkElement = getByText(/Ari Asulin/i);
  expect(linkElement).toBeInTheDocument();
});

// require('./song/Song.test.js')
