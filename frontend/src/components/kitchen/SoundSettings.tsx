import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { kitchenSoundService, type SoundSettings as SoundSettingsType, type SoundEvent } from '@/services/soundService';
import { cn } from '@/lib/utils';

interface SoundSettingsProps {
  className?: string;
  onClose?: () => void;
}

const defaultSettings: SoundSettingsType = {
  enabled: false,
  volume: 0.7,
  newOrderEnabled: true,
  orderReadyEnabled: true,
  takeawayReadyEnabled: true,
};

export function SoundSettings({ className, onClose }: SoundSettingsProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SoundSettingsType>(
    kitchenSoundService.getSettings() ?? defaultSettings
  );
  const [isTestingSound, setIsTestingSound] = useState<string | null>(null);

  useEffect(() => {
    // Load current settings when component mounts
    const loadedSettings = kitchenSoundService.getSettings();
    if (loadedSettings) {
      setSettings(loadedSettings);
    }
  }, []);

  const handleSettingChange = (key: keyof SoundSettingsType, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    kitchenSoundService.updateSettings({ [key]: value });
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    handleSettingChange('volume', volume);
  };

  const testSound = async (type: SoundEvent['type']) => {
    if (isTestingSound) return;
    
    setIsTestingSound(type);
    try {
      await kitchenSoundService.testSound(type);
    } catch (error) {
      console.error('Failed to test sound:', error);
    } finally {
      setTimeout(() => setIsTestingSound(null), 1000);
    }
  };

  const soundTests = [
    {
      type: 'new_order' as const,
      labelKey: 'kitchen.newOrderAlert',
      descriptionKey: 'kitchen.newOrderAlertDesc',
      icon: '🆕',
    },
    {
      type: 'order_ready' as const,
      labelKey: 'kitchen.orderReadyAlert',
      descriptionKey: 'kitchen.orderReadyAlertDesc',
      icon: '✅',
    },
    {
      type: 'takeaway_ready' as const,
      labelKey: 'kitchen.takeawayReadyAlert',
      descriptionKey: 'kitchen.takeawayReadyAlertDesc',
      icon: '📦',
    },
  ];

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {t('kitchen.soundSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Sound Control */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">{t('kitchen.enableSounds')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('kitchen.soundsDescription')}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <Label className="text-base font-medium flex items-center gap-2">
            {settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {t('kitchen.volume')}: {Math.round(settings.volume * 100)}%
          </Label>
          <Slider
            value={[settings.volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            disabled={!settings.enabled}
            className="w-full"
          />
        </div>

        {/* Individual Sound Controls */}
        <div className="space-y-4">
          <Label className="text-base font-medium">{t('kitchen.soundTypes')}</Label>

          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('kitchen.newOrdersSound')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('kitchen.newOrdersSoundDesc')}
                </p>
              </div>
              <Switch
                checked={settings.newOrderEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('newOrderEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('kitchen.orderReadySound')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('kitchen.orderReadySoundDesc')}
                </p>
              </div>
              <Switch
                checked={settings.orderReadyEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('orderReadyEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('kitchen.takeawayReadySound')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('kitchen.takeawayReadySoundDesc')}
                </p>
              </div>
              <Switch
                checked={settings.takeawayReadyEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('takeawayReadyEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        {/* Sound Test Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">{t('kitchen.testSounds')}</Label>
          <div className="grid gap-2">
            {soundTests.map((sound) => (
              <Button
                key={sound.type}
                variant="outline"
                size="sm"
                onClick={() => testSound(sound.type)}
                disabled={!settings.enabled || isTestingSound !== null}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{sound.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{t(sound.labelKey)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(sound.descriptionKey)}
                    </div>
                  </div>
                  {isTestingSound === sound.type ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {onClose && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              {t('kitchen.done')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
