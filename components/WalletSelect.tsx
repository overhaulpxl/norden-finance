import { Balance } from '../types';
import { formatMethodName } from '../lib/format';

interface WalletSelectProps {
  wallets: Balance[];
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function getActiveWallets(wallets: Balance[]) {
  return wallets
    .filter((wallet) => !wallet.archivedAt)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function WalletSelect({
  wallets,
  value,
  onChange,
  className,
  placeholder = 'Pilih Wallet',
  required = false,
  disabled = false,
}: WalletSelectProps) {
  const activeWallets = getActiveWallets(wallets);
  const isDisabled = disabled || activeWallets.length === 0;

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      required={required}
      disabled={isDisabled}
    >
      <option value="" className="bg-white dark:bg-neutral-800 text-black dark:text-white">{isDisabled ? 'Tambah wallet dulu' : placeholder}</option>
      {activeWallets.map((wallet) => (
        <option key={wallet.id} value={wallet.name} className="bg-white dark:bg-neutral-800 text-black dark:text-white">
          {formatMethodName(wallet.name)}
        </option>
      ))}
    </select>
  );
}
