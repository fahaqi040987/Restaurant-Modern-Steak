import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BilingualInputProps {
  label: string;
  idValue: string;
  enValue: string;
  onIdChange: (value: string) => void;
  onEnChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: { id: string; en: string };
}

export function BilingualInput({
  label,
  idValue,
  enValue,
  onIdChange,
  onEnChange,
  multiline = false,
  placeholder,
}: BilingualInputProps) {
  const Component = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Bahasa Indonesia</Label>
          <Component
            value={idValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onIdChange(e.target.value)}
            placeholder={placeholder?.id}
            rows={multiline ? 3 : undefined}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">English</Label>
          <Component
            value={enValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEnChange(e.target.value)}
            placeholder={placeholder?.en}
            rows={multiline ? 3 : undefined}
          />
        </div>
      </div>
    </div>
  );
}
