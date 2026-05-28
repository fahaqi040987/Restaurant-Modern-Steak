import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BilingualInput } from './BilingualInput';
import { useFranchiseContent, useUpdateFranchiseContent, type FranchisePackage, type PackagesData } from '@/hooks/useFranchiseContent';
import { Plus, Trash2, Loader2, GripVertical, Star } from 'lucide-react';

function createEmptyPackage(): FranchisePackage {
  return {
    slug: '',
    name: { id: '', en: '' },
    description: { id: '', en: '' },
    highlights: { id: '', en: '' },
    priceRange: { id: '', en: '' },
    isFeatured: false,
    sortOrder: 0,
    isActive: true,
  };
}

export function PackagesTab() {
  const { data, isLoading } = useFranchiseContent();
  const updateMutation = useUpdateFranchiseContent('packages');

  const [packages, setPackages] = useState<FranchisePackage[]>([createEmptyPackage()]);

  useEffect(() => {
    const pkgData = data?.packages as PackagesData | undefined;
    if (pkgData?.packages) {
      setPackages(pkgData.packages.map(p => ({
        ...createEmptyPackage(),
        ...p,
        name: p.name || { id: '', en: '' },
        description: p.description || { id: '', en: '' },
        highlights: p.highlights || { id: '', en: '' },
        priceRange: p.priceRange || { id: '', en: '' },
      })));
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const addPackage = () => setPackages([...packages, createEmptyPackage()]);

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: string, value: unknown) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const updatePackageBilingual = (index: number, field: string, lang: 'id' | 'en', value: string) => {
    const updated = [...packages];
    const current = updated[index][field as keyof FranchisePackage] as { id: string; en: string };
    updated[index] = {
      ...updated[index],
      [field]: { ...current, [lang]: value },
    };
    setPackages(updated);
  };

  const movePackage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= packages.length) return;
    const updated = [...packages];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((pkg, i) => (pkg.sortOrder = i));
    setPackages(updated);
  };

  const handleSave = () => {
    const sorted = packages.map((pkg, i) => ({ ...pkg, sortOrder: i }));
    updateMutation.mutate({ packages: sorted });
  };

  return (
    <div className="space-y-4">
      {packages.map((pkg, index) => (
        <Card key={index} className={!pkg.isActive ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  {pkg.name.id || pkg.name.en || `Paket ${index + 1}`}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className={`h-4 w-4 ${pkg.isFeatured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                  <Label className="text-xs">Featured</Label>
                  <Switch
                    checked={pkg.isFeatured}
                    onCheckedChange={(v) => updatePackage(index, 'isFeatured', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Aktif</Label>
                  <Switch
                    checked={pkg.isActive}
                    onCheckedChange={(v) => updatePackage(index, 'isActive', v)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => movePackage(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => movePackage(index, 'down')}
                  disabled={index === packages.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePackage(index)}
                  disabled={packages.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Slug</Label>
              <Input
                value={pkg.slug}
                onChange={(e) => updatePackage(index, 'slug', e.target.value)}
                placeholder="e.g. starter, premium, signature"
              />
            </div>

            <BilingualInput
              label="Nama Paket"
              idValue={pkg.name.id}
              enValue={pkg.name.en}
              onIdChange={(v) => updatePackageBilingual(index, 'name', 'id', v)}
              onEnChange={(v) => updatePackageBilingual(index, 'name', 'en', v)}
            />

            <BilingualInput
              label="Deskripsi"
              idValue={pkg.description.id}
              enValue={pkg.description.en}
              onIdChange={(v) => updatePackageBilingual(index, 'description', 'id', v)}
              onEnChange={(v) => updatePackageBilingual(index, 'description', 'en', v)}
              multiline
            />

            <BilingualInput
              label="Highlights (pisahkan dengan koma)"
              idValue={pkg.highlights.id}
              enValue={pkg.highlights.en}
              onIdChange={(v) => updatePackageBilingual(index, 'highlights', 'id', v)}
              onEnChange={(v) => updatePackageBilingual(index, 'highlights', 'en', v)}
              multiline
            />

            <BilingualInput
              label="Range Harga"
              idValue={pkg.priceRange.id}
              enValue={pkg.priceRange.en}
              onIdChange={(v) => updatePackageBilingual(index, 'priceRange', 'id', v)}
              onEnChange={(v) => updatePackageBilingual(index, 'priceRange', 'en', v)}
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addPackage} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Tambah Paket Baru
      </Button>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Simpan Paket Franchise
        </Button>
      </div>
    </div>
  );
}
