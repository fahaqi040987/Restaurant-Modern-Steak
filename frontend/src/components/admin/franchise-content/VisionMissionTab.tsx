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

  const [vision, setVision] = useState<{ id: string; en: string }>({ id: '', en: '' });
  const [missions, setMissions] = useState<{ id: string; en: string }[]>([{ id: '', en: '' }]);

  useEffect(() => {
    const vm = data?.vision_mission as VisionMissionData | undefined;
    if (vm) {
      setVision(vm.vision);
      setMissions(vm.missions);
    }
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const addMission = () => setMissions([...missions, { id: '', en: '' }]);

  const removeMission = (index: number) => {
    if (missions.length > 1) {
      setMissions(missions.filter((_, i) => i !== index));
    }
  };

  const updateMission = (index: number, field: 'id' | 'en', value: string) => {
    const updated = [...missions];
    updated[index] = { ...updated[index], [field]: value };
    setMissions(updated);
  };

  const handleSave = () => {
    updateMutation.mutate({ vision, missions });
  };

  return (
    <div className="space-y-6">
      <BilingualInput
        label="Visi"
        idValue={vision.id}
        enValue={vision.en}
        onIdChange={(v) => setVision({ ...vision, id: v })}
        onEnChange={(v) => setVision({ ...vision, en: v })}
        multiline
        placeholder={{ id: 'Tulis visi dalam Bahasa Indonesia...', en: 'Write vision in English...' }}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Misi Points</Label>
          <Button variant="outline" size="sm" onClick={addMission}>
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>

        {missions.map((mission, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-muted-foreground text-sm font-mono mt-2 w-6">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <Textarea
                  value={mission.id}
                  onChange={(e) => updateMission(index, 'id', e.target.value)}
                  placeholder="Misi dalam Bahasa Indonesia..."
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">EN</Label>
                <Textarea
                  value={mission.en}
                  onChange={(e) => updateMission(index, 'en', e.target.value)}
                  placeholder="Mission in English..."
                  rows={2}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeMission(index)}
              disabled={missions.length <= 1}
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
