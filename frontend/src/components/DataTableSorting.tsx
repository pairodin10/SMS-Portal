import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowUp } from 'lucide-react';

type SortValue = string | number | null | undefined;
type SortDirection = 'ascending' | 'descending';

const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function useDataTableSort<T>(
  items: T[],
  getValue: (item: T, key: string) => SortValue,
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>('ascending');
  const getValueRef = useRef(getValue);
  getValueRef.current = getValue;

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    return items
      .map((item, index) => ({ item, index, value: getValueRef.current(item, sortKey) }))
      .sort((left, right) => {
        const leftValue = left.value;
        const rightValue = right.value;
        if (leftValue == null || leftValue === '') return rightValue == null || rightValue === '' ? left.index - right.index : 1;
        if (rightValue == null || rightValue === '') return -1;

        const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : textCollator.compare(String(leftValue), String(rightValue));
        return (direction === 'ascending' ? comparison : -comparison) || left.index - right.index;
      })
      .map(({ item }) => item);
  }, [direction, items, sortKey]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setDirection((current) => current === 'ascending' ? 'descending' : 'ascending');
      return;
    }
    setSortKey(key);
    setDirection('ascending');
  };

  return { sortedItems, sortKey, direction, toggleSort };
}

type SortableTableHeaderProps = {
  label: string;
  sortKey: string;
  activeSortKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
};

export function SortableTableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  className = 'px-3 py-3 font-medium',
}: SortableTableHeaderProps) {
  const isActive = activeSortKey === sortKey;
  const SortIcon = isActive
    ? direction === 'ascending' ? ArrowUp : ArrowDown
    : ArrowDownUp;

  return (
    <th aria-sort={isActive ? direction : 'none'} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}${isActive ? `, ${direction}` : ''}`}
        title={`Sort by ${label}`}
        className="inline-flex items-center gap-1.5 whitespace-nowrap text-left transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
      >
        {label}
        <SortIcon size={14} aria-hidden="true" className={isActive ? 'text-violet-300' : 'text-slate-500'} />
      </button>
    </th>
  );
}
