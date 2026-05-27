import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BilingualInput } from './BilingualInput';
import { useFranchiseContent, useUpdateFranchiseContent, type VisionMissionData } from '@/hooks/useFranchiseContent';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export function VisionMissionTab() {
  const { data, isLoading } = useFranchiseContent();
  const updateMutation = useUpdateFranchiseContent('vision_mission');

  const [mission, setMission] = useState<{ id: string; en: string }>({ id: '', en: '' });
  const [visions, setVisions] = useState<{ id: string; en: string }[]>([{ id: '', en: '' }]);

  useEffect(() => {
    const vm = data?.vision_mission as VisionMissionData | undefined;
    if (vm) {
      setMission(vm.mission);
      setVisions(vm.visions);
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const addVision = () => setVisions([...visions, { id: '', en: '' }]);

  const removeVision = (index: number) => {
    if (visions.length > 1) {
      setVisions(visions.filter((_, i) => i !== index));
    }
  };

  const updateVision = (index: number, field: 'id' | 'en', value: string) => {
    const updated = [...visions];
    updated[index] = { ...updated[index], [field]: value };
    setVisions(updated);
  };

  const handleSave = () => {
    updateMutation.mutate({ mission, visions });
  };

  return (
    <div className="space-y-6">
      <BilingualInput
        label="Misi"
        idValue={mission.id}
        enValue={mission.en}
        onIdChange={(v) => setMission({ ...mission, id: v })}
        onEnChange={(v) => setMission({ ...mission, en: v })}
        multiline
        placeholder={{ id: 'Tulis misi dalam Bahasa Indonesia...', en: 'Write mission in English...' }}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Visi Points</Label>
          <Button variant="outline" size="sm" onClick={addVision}>
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>

        {visions.map((vision, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-muted-foreground text-sm font-mono mt-2 w-6">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <Textarea
                  value={vision.id}
                  onChange={(e) => updateVision(index, 'id', e.target.value)}
                  placeholder="Visi dalam Bahasa Indonesia..."
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">EN</Label>
                <Textarea
                  value={vision.en}
                  onChange={(e) => updateVision(index, 'en', e.target.value)}
                  placeholder="Vision in English..."
                  rows={2}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeVision(index)}
              disabled={visions.length <= 1}
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
          Simpan Visi & Misi
        </Button>
      </div>
    </div>
  );
}
