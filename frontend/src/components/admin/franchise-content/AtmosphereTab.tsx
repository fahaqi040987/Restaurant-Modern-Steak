import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { BilingualInput } from './BilingualInput';
import { useFranchiseContent, useUpdateFranchiseContent, type AtmosphereItem, type AtmosphereData } from '@/hooks/useFranchiseContent';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

function createEmptyItem(): AtmosphereItem {
  return {
    id: `gallery-${Date.now()}`,
    image: '',
    caption: { id: '', en: '' },
    sortOrder: 0,
  };
}

export function AtmosphereTab() {
  const { data, isLoading } = useFranchiseContent();
  const updateMutation = useUpdateFranchiseContent('atmosphere');

  const [items, setItems] = useState<AtmosphereItem[]>([createEmptyItem()]);

  useEffect(() => {
    const atm = data?.atmosphere as AtmosphereData | undefined;
    if (atm?.items) {
      setItems(atm.items.map(item => ({
        ...createEmptyItem(),
        ...item,
        caption: item.caption || { id: '', en: '' },
      })));
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const addItem = () => setItems([...items, createEmptyItem()]);

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof AtmosphereItem, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const updateCaption = (index: number, lang: 'id' | 'en', value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      caption: { ...updated[index].caption, [lang]: value },
    };
    setItems(updated);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((item, i) => (item.sortOrder = i));
    setItems(updated);
  };

  const handleSave = () => {
    const sorted = items.map((item, i) => ({ ...item, sortOrder: i }));
    updateMutation.mutate({ items: sorted });
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.id + '-' + index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  {item.caption.id || item.caption.en || `Galeri ${index + 1}`}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">ID / Slug</Label>
              <Input
                value={item.id}
                onChange={(e) => updateItem(index, 'id', e.target.value)}
                placeholder="e.g. outlet-day, indoor, outdoor"
              />
            </div>

            <ImageUploader
              value={item.image}
              onChange={(url) => updateItem(index, 'image', url || '')}
            />

            <BilingualInput
              label="Caption"
              idValue={item.caption.id}
              enValue={item.caption.en}
              onIdChange={(v) => updateCaption(index, 'id', v)}
              onEnChange={(v) => updateCaption(index, 'en', v)}
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Tambah Galeri Baru
      </Button>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Simpan Galeri Outlet
        </Button>
      </div>
    </div>
  );
}
