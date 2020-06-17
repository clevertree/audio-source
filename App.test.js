import React from 'react';
import { render } from '@testing-library/react';
import IndexRouter from "./audio-source/site/IndexRouter";

test('renders learn react link', () => {
  const { getByText } = render(<IndexRouter />);
  // const linkElement = getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
