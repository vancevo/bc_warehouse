import { useState } from 'react';
import { formatVietnameseDate, maskVietnameseDate } from '../lib/date';

export function VietnameseDateInput({
  name,
  defaultValue = formatVietnameseDate(),
  required = true,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  return <input
    name={name}
    type="text"
    inputMode="numeric"
    autoComplete="off"
    maxLength={10}
    pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}"
    title="Nhập ngày theo định dạng DD/MM/YYYY"
    placeholder="DD/MM/YYYY"
    value={value}
    onChange={(event) => setValue(maskVietnameseDate(event.target.value))}
    required={required}
  />;
}
