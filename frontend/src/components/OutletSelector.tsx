import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Outlet {
  menuSharingCode: string;
  name: string;
  id: string;
}

interface OutletSelectorProps {
  value?: string[];
  onChange: (menuSharingCodes: string[]) => void;
}

// Static list of outlets (can be moved to DB later)
const OUTLETS: Outlet[] = [
  { menuSharingCode: 'uvhn3bim', name: 'UC - Vastrapur (340305)', id: '340305' },
  { menuSharingCode: 't2jrg8ez', name: 'UC - Another Outlet (340304)', id: '340304' },
];

const OutletSelector = ({ value, onChange }: OutletSelectorProps) => {
  return (
    <Select
      mode="multiple"
      value={value || ['uvhn3bim']}
      onChange={onChange}
      style={{ width: 400 }}
      placeholder="Select Outlets (use checkboxes)"
      options={OUTLETS.map(outlet => ({
        value: outlet.menuSharingCode,
        label: outlet.name,
      }))}
      maxTagCount="responsive"
    />
  );
};

export default OutletSelector;
