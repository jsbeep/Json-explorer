import { Database, Layers, Braces } from 'lucide-react';

interface PlaceholderColumnProps {
  slotIndex: number;
}

const SLOT_HINTS = [
  { icon: Database, text: '데이터베이스를 선택하세요' },
  { icon: Layers, text: '컬렉션을 선택하세요' },
  { icon: Braces, text: '문서를 선택하면 필드가 표시됩니다' },
] as const;

export function PlaceholderColumn({ slotIndex }: PlaceholderColumnProps) {
  const hint = SLOT_HINTS[slotIndex] ?? SLOT_HINTS[2];
  const Icon = hint.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center bg-white">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className="text-[12px] text-slate-400 leading-relaxed">{hint.text}</p>
    </div>
  );
}
