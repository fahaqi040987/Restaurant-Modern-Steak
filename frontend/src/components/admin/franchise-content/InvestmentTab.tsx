import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BilingualInput } from './BilingualInput';
import { useFranchiseContent, useUpdateFranchiseContent, type InvestmentData, type Benefit } from '@/hooks/useFranchiseContent';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'shield', label: 'Shield' },
  { value: 'award', label: 'Award' },
  { value: 'truck', label: 'Truck' },
  { value: 'megaphone', label: 'Megaphone' },
  { value: 'trending-up', label: 'Trending Up' },
  { value: 'headphones', label: 'Headphones' },
];

export function InvestmentTab() {
  const { data, isLoading } = useFranchiseContent();
  const updateMutation = useUpdateFranchiseContent('investment');

  const [title, setTitle] = useState({ id: '', en: '' });
  const [subtitle, setSubtitle] = useState({ id: '', en: '' });
  const [roiEstimate, setRoiEstimate] = useState({ id: '', en: '' });
  const [benefits, setBenefits] = useState<Benefit[]>([{ id: '', en: '', icon: 'shield' }]);

  useEffect(() => {
    const inv = data?.investment as InvestmentData | undefined;
    if (inv) {
      setTitle(inv.title || { id: '', en: '' });
      setSubtitle(inv.subtitle || { id: '', en: '' });
      setRoiEstimate(inv.roiEstimate || { id: '', en: '' });
      setBenefits(inv.benefits || [{ id: '', en: '', icon: 'shield' }]);
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const addBenefit = () => setBenefits([...benefits, { id: '', en: '', icon: 'shield' }]);

  const removeBenefit = (index: number) => {
    if (benefits.length > 1) {
      setBenefits(benefits.filter((_, i) => i !== index));
    }
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    const updated = [...benefits];
    updated[index] = { ...updated[index], [field]: value };
    setBenefits(updated);
  };

  const handleSave = () => {
    updateMutation.mutate({ title, subtitle, roiEstimate, benefits });
  };

  return (
    <div className="space-y-6">
      <BilingualInput
        label="Judul"
        idValue={title.id}
        enValue={title.en}
        onIdChange={(v) => setTitle({ ...title, id: v })}
        onEnChange={(v) => setTitle({ ...title, en: v })}
      />

      <BilingualInput
        label="Subtitle"
        idValue={subtitle.id}
        enValue={subtitle.en}
        onIdChange={(v) => setSubtitle({ ...subtitle, id: v })}
        onEnChange={(v) => setSubtitle({ ...subtitle, en: v })}
      />

      <BilingualInput
        label="Estimasi ROI"
        idValue={roiEstimate.id}
        enValue={roiEstimate.en}
        onIdChange={(v) => setRoiEstimate({ ...roiEstimate, id: v })}
        onEnChange={(v) => setRoiEstimate({ ...roiEstimate, en: v })}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Benefits</Label>
          <Button variant="outline" size="sm" onClick={addBenefit}>
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>

        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-32 space-y-1">
              <Label className="text-xs text-muted-foreground">Icon</Label>
              <Select
                value={benefit.icon}
                onValueChange={(v) => updateBenefit(index, 'icon', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <Input
                  value={benefit.id}
                  onChange={(e) => updateBenefit(index, 'id', e.target.value)}
                  placeholder="Benefit dalam Bahasa Indonesia..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">EN</Label>
                <Input
                  value={benefit.en}
                  onChange={(e) => updateBenefit(index, 'en', e.target.value)}
                  placeholder="Benefit in English..."
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeBenefit(index)}
              disabled={benefits.length <= 1}
              className="mt-6"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Simpan Investasi
        </Button>
      </div>
    </div>
  );
}
