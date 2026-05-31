import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/utils.ts',
        'src/hooks/useKeyboardShortcuts.ts',
        'src/hooks/useLoadingStates.ts',
        'src/components/ui/button.tsx',
        'src/components/ui/badge.tsx',
        'src/components/ui/card.tsx',
        'src/components/ui/checkbox.tsx',
        'src/components/ui/input.tsx',
        'src/components/ui/label.tsx',
        'src/components/ui/progress.tsx',
        'src/components/ui/switch.tsx',
        'src/components/ui/slider.tsx',
        'src/components/kitchen/EnhancedOrderCard.tsx',
        'src/components/kitchen/SoundSettings.tsx',
        'src/components/kitchen/KitchenOrderCard.tsx',
        'src/components/LanguageSwitcher.tsx',
        'src/components/admin/ProfilePage.tsx',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
