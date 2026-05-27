import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/client';
import { toastHelpers } from '@/lib/toast-helpers';

interface BilingualText {
  id: string;
  en: string;
}

interface VisionPoint {
  id: string;
  en: string;
}

interface VisionMissionData {
  mission: BilingualText;
  visions: VisionPoint[];
}

interface FranchisePackage {
  slug: string;
  name: BilingualText;
  description: BilingualText;
  highlights: BilingualText;
  priceRange: BilingualText;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface PackagesData {
  packages: FranchisePackage[];
}

interface Benefit {
  id: string;
  en: string;
  icon: string;
}

interface InvestmentData {
  title: BilingualText;
  subtitle: BilingualText;
  roiEstimate: BilingualText;
  benefits: Benefit[];
}

interface AllFranchiseContent {
  vision_mission?: VisionMissionData;
  packages?: PackagesData;
  investment?: InvestmentData;
}

type Locale = 'id' | 'en';

function getLocale(i18nLanguage: string): Locale {
  return i18nLanguage === 'id-ID' ? 'id' : 'en';
}

function getText(field: BilingualText | undefined, locale: Locale): string {
  if (!field) return '';
  return field[locale] || field.id || '';
}

export function useFranchiseContent() {
  const { i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  const query = useQuery<AllFranchiseContent>({
    queryKey: ['franchise-content'],
    queryFn: async () => {
      const response = await apiClient.getFranchiseContent();
      if (!response.success) {
        throw new Error(response.message);
      }
      return (response as { data: AllFranchiseContent }).data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, locale, getText };
}

export function useUpdateFranchiseContent(section: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: unknown) => {
      const response = await apiClient.updateFranchiseContent(section, content);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-content'] });
      toastHelpers.success('Franchise content saved successfully!');
    },
    onError: (error: Error) => {
      toastHelpers.error(error.message || 'Failed to save franchise content');
    },
  });
}

export type {
  BilingualText,
  VisionPoint,
  VisionMissionData,
  FranchisePackage,
  PackagesData,
  Benefit,
  InvestmentData,
  AllFranchiseContent,
  Locale,
};
export { getLocale };
