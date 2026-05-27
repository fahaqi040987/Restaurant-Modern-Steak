import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisionMissionTab } from './VisionMissionTab';
import { PackagesTab } from './PackagesTab';
import { InvestmentTab } from './InvestmentTab';
import { Target, Package, TrendingUp } from 'lucide-react';

export function FranchiseContentEditor() {
  const [activeTab, setActiveTab] = useState('vision-mission');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Franchise Content Management</h1>
        <p className="text-muted-foreground mt-1">
          Kelola konten halaman franchise — Visi & Misi, Paket, dan Investasi.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vision-mission" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Visi & Misi
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Paket Franchise
          </TabsTrigger>
          <TabsTrigger value="investment" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Investasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vision-mission" className="mt-6">
          <VisionMissionTab />
        </TabsContent>
        <TabsContent value="packages" className="mt-6">
          <PackagesTab />
        </TabsContent>
        <TabsContent value="investment" className="mt-6">
          <InvestmentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
