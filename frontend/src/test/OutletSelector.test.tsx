import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutletSelector from '../components/OutletSelector';

describe('OutletSelector', () => {
  it('renders a combobox/select element', () => {
    const onChange = vi.fn();
    render(<OutletSelector value={[]} onChange={onChange} />);

    // Should show the combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const onChange = vi.fn();
    render(
      <OutletSelector
        value={[]}
        onChange={onChange}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
  });

  it('accepts selected values', () => {
    const onChange = vi.fn();
    const { container } = render(
      <OutletSelector
        value={['uvhn3bim']}
        onChange={onChange}
      />
    );

    // The select container should exist
    const selectContainer = container.querySelector('.ant-select');
    expect(selectContainer).toBeInTheDocument();
    expect(selectContainer).toHaveClass('ant-select-multiple');
  });

  it('renders with default width style', () => {
    const onChange = vi.fn();
    const { container } = render(<OutletSelector value={[]} onChange={onChange} />);

    const selectContainer = container.querySelector('.ant-select');
    expect(selectContainer).toHaveStyle('width: 400px');
  });

  it('accepts custom style', () => {
    const onChange = vi.fn();
    const { container } = render(
      <OutletSelector
        value={[]}
        onChange={onChange}
        style={{ width: 200 }}
      />
    );

    const selectContainer = container.querySelector('.ant-select');
    expect(selectContainer).toHaveStyle('width: 200px');
  });
});
