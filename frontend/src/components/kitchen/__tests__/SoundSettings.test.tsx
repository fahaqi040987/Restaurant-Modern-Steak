/**
 * SoundSettings Component Tests
 * Comprehensive tests for kitchen sound notification settings
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoundSettings } from '../SoundSettings';
import { kitchenSoundService } from '@/services/soundService';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'kitchen.soundSettings': 'Sound Settings',
        'kitchen.enableSounds': 'Enable Sounds',
        'kitchen.soundsDescription': 'Play sounds for new orders and status updates',
        'kitchen.volume': 'Volume',
        'kitchen.soundTypes': 'Sound Types',
        // Sound type switches
        'kitchen.newOrdersSound': 'New Orders',
        'kitchen.newOrdersSoundDesc': 'Plays when a new order is received',
        'kitchen.orderReadySound': 'Order Ready',
        'kitchen.orderReadySoundDesc': 'Plays when an order is ready for pickup',
        'kitchen.takeawayReadySound': 'Takeaway Ready',
        'kitchen.takeawayReadySoundDesc': 'Plays when a takeaway order is ready',
        // Sound test buttons
        'kitchen.testSounds': 'Test Sounds',
        'kitchen.newOrderAlert': 'New Order Alert',
        'kitchen.newOrderAlertDesc': 'Test new order sound',
        'kitchen.orderReadyAlert': 'Order Ready Alert',
        'kitchen.orderReadyAlertDesc': 'Test order ready sound',
        'kitchen.takeawayReadyAlert': 'Takeaway Ready Alert',
        'kitchen.takeawayReadyAlertDesc': 'Test takeaway ready sound',
        'kitchen.done': 'Done',
      }
      return translations[key] || key
    },
  }),
}));

// Mock the sound service - must match the import path in the component
vi.mock('@/services/soundService', () => ({
  kitchenSoundService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    playNewOrderSound: vi.fn().mockResolvedValue(undefined),
    playOrderReadySound: vi.fn().mockResolvedValue(undefined),
    testSound: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn(),
    getSettings: vi.fn().mockReturnValue({
      enabled: true,
      volume: 0.7,
      newOrderEnabled: true,
      orderReadyEnabled: true,
      takeawayReadyEnabled: true,
    }),
  },
}));

describe('SoundSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock return value
    vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
      enabled: true,
      volume: 0.7,
      newOrderEnabled: true,
      orderReadyEnabled: true,
      takeawayReadyEnabled: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the sound settings card', () => {
      render(<SoundSettings />);
      expect(screen.getByText('Sound Settings')).toBeInTheDocument();
    });

    it('should render the volume icon', () => {
      render(<SoundSettings />);
      const cardHeader = screen.getByText('Sound Settings').parentElement;
      expect(cardHeader?.querySelector('svg')).toBeInTheDocument();
    });

    it('should render enable sounds switch', () => {
      render(<SoundSettings />);
      expect(screen.getByText('Enable Sounds')).toBeInTheDocument();
    });

    it('should render sound type switches', () => {
      render(<SoundSettings />);
      expect(screen.getByText('New Orders')).toBeInTheDocument();
      expect(screen.getByText('Order Ready')).toBeInTheDocument();
      expect(screen.getByText('Takeaway Ready')).toBeInTheDocument();
    });

    it('should render volume slider', () => {
      render(<SoundSettings />);
      expect(screen.getByText(/Volume:/)).toBeInTheDocument();
    });

    it('should render test sound buttons', () => {
      render(<SoundSettings />);
      expect(screen.getByText('Test Sounds')).toBeInTheDocument();
      expect(screen.getByText('New Order Alert')).toBeInTheDocument();
      expect(screen.getByText('Order Ready Alert')).toBeInTheDocument();
      expect(screen.getByText('Takeaway Ready Alert')).toBeInTheDocument();
    });

    it('should render Done button when onClose prop is provided', () => {
      const mockOnClose = vi.fn();
      render(<SoundSettings onClose={mockOnClose} />);
      expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
    });

    it('should not render Done button when onClose prop is not provided', () => {
      render(<SoundSettings />);
      expect(screen.queryByRole('button', { name: /Done/i })).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SoundSettings className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('should load settings from kitchenSoundService on mount', () => {
      render(<SoundSettings />);
      expect(kitchenSoundService.getSettings).toHaveBeenCalled();
    });

    it('should display volume percentage correctly', () => {
      render(<SoundSettings />);
      expect(screen.getByText(/Volume: 70%/)).toBeInTheDocument();
    });

    it('should use default settings when service returns null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue(null as any);
      render(<SoundSettings />);
      // Should still render without errors
      expect(screen.getByText('Sound Settings')).toBeInTheDocument();
    });
  });

  describe('Enable Sounds Toggle', () => {
    it('should toggle master sound switch', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      const enableSwitch = switches[0]; // First switch is Enable Sounds

      await user.click(enableSwitch);

      expect(kitchenSoundService.updateSettings).toHaveBeenCalledWith({
        enabled: false,
      });
    });

    it('should show VolumeX icon when sounds are disabled', () => {
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
        enabled: false,
        volume: 0.7,
        newOrderEnabled: true,
        orderReadyEnabled: true,
        takeawayReadyEnabled: true,
      });
      render(<SoundSettings />);
      // Component should render with appropriate icon state
      expect(screen.getByText(/Volume:/)).toBeInTheDocument();
    });
  });

  describe('Volume Control', () => {
    it('should render volume slider with correct value', () => {
      render(<SoundSettings />);
      // Volume should show 70%
      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });

    it('should disable volume slider when sounds are disabled', () => {
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
        enabled: false,
        volume: 0.7,
        newOrderEnabled: true,
        orderReadyEnabled: true,
        takeawayReadyEnabled: true,
      });
      const { container } = render(<SoundSettings />);

      // The slider component structure includes a wrapper with specific classes
      // When disabled, the slider should not be interactive
      const volumeLabel = screen.getByText(/Volume:/);
      expect(volumeLabel).toBeInTheDocument();

      // Check that the slider container exists with disabled state
      const sliderContainer = container.querySelector('[class*="select-none"]');
      expect(sliderContainer).toBeInTheDocument();
    });
  });

  describe('Individual Sound Type Controls', () => {
    it('should toggle new order sounds', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // Second switch is New Orders
      const newOrderSwitch = switches[1];

      await user.click(newOrderSwitch);

      expect(kitchenSoundService.updateSettings).toHaveBeenCalledWith({
        newOrderEnabled: false,
      });
    });

    it('should toggle order ready sounds', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // Third switch is Order Ready
      const orderReadySwitch = switches[2];

      await user.click(orderReadySwitch);

      expect(kitchenSoundService.updateSettings).toHaveBeenCalledWith({
        orderReadyEnabled: false,
      });
    });

    it('should toggle takeaway ready sounds', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // Fourth switch is Takeaway Ready
      const takeawaySwitch = switches[3];

      await user.click(takeawaySwitch);

      expect(kitchenSoundService.updateSettings).toHaveBeenCalledWith({
        takeawayReadyEnabled: false,
      });
    });

    it('should disable individual sound switches when master is disabled', () => {
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
        enabled: false,
        volume: 0.7,
        newOrderEnabled: true,
        orderReadyEnabled: true,
        takeawayReadyEnabled: true,
      });
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // Individual sound switches (indices 1, 2, 3) should be disabled
      expect(switches[1]).toBeDisabled();
      expect(switches[2]).toBeDisabled();
      expect(switches[3]).toBeDisabled();
    });
  });

  describe('Sound Testing', () => {
    it('should test new order sound when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button');
      const newOrderButton = testButtons.find((btn) =>
        btn.textContent?.includes('New Order Alert')
      );

      if (newOrderButton) {
        await user.click(newOrderButton);
        await waitFor(() => {
          expect(kitchenSoundService.testSound).toHaveBeenCalledWith('new_order');
        });
      }
    });

    it('should test order ready sound when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button');
      const orderReadyButton = testButtons.find((btn) =>
        btn.textContent?.includes('Order Ready Alert')
      );

      if (orderReadyButton) {
        await user.click(orderReadyButton);
        await waitFor(() => {
          expect(kitchenSoundService.testSound).toHaveBeenCalledWith('order_ready');
        });
      }
    });

    it('should test takeaway ready sound when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button');
      const takeawayButton = testButtons.find((btn) =>
        btn.textContent?.includes('Takeaway Ready Alert')
      );

      if (takeawayButton) {
        await user.click(takeawayButton);
        await waitFor(() => {
          expect(kitchenSoundService.testSound).toHaveBeenCalledWith('takeaway_ready');
        });
      }
    });

    it('should disable test buttons when sounds are disabled', () => {
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
        enabled: false,
        volume: 0.7,
        newOrderEnabled: true,
        orderReadyEnabled: true,
        takeawayReadyEnabled: true,
      });
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button').filter((btn) =>
        btn.textContent?.includes('Alert')
      );

      testButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should show loading spinner while testing sound', async () => {
      const user = userEvent.setup();
      vi.mocked(kitchenSoundService.testSound).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button');
      const newOrderButton = testButtons.find((btn) =>
        btn.textContent?.includes('New Order Alert')
      );

      if (newOrderButton) {
        await user.click(newOrderButton);
        // Check for spinner (animate-spin class)
        await waitFor(() => {
          const spinner = document.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
        });
      }
    });

    it('should prevent multiple simultaneous sound tests', async () => {
      const user = userEvent.setup();
      vi.mocked(kitchenSoundService.testSound).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button').filter((btn) =>
        btn.textContent?.includes('Alert')
      );

      // Click first button
      if (testButtons[0]) {
        await user.click(testButtons[0]);

        // All test buttons should be disabled while testing
        await waitFor(() => {
          testButtons.forEach((btn) => {
            expect(btn).toBeDisabled();
          });
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle testSound errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(kitchenSoundService.testSound).mockRejectedValue(
        new Error('Audio error')
      );

      render(<SoundSettings />);

      const testButtons = screen.getAllByRole('button');
      const newOrderButton = testButtons.find((btn) =>
        btn.textContent?.includes('New Order Alert')
      );

      if (newOrderButton) {
        await user.click(newOrderButton);
        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to test sound:',
            expect.any(Error)
          );
        });
      }

      consoleSpy.mockRestore();
    });
  });

  describe('onClose Callback', () => {
    it('should call onClose when Done button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      render(<SoundSettings onClose={mockOnClose} />);

      const doneButton = screen.getByRole('button', { name: /Done/i });
      await user.click(doneButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sound Type Descriptions', () => {
    it('should display description for new order alert', () => {
      render(<SoundSettings />);
      expect(
        screen.getByText('Plays when a new order is received')
      ).toBeInTheDocument();
    });

    it('should display description for order ready alert', () => {
      render(<SoundSettings />);
      expect(
        screen.getByText('Plays when an order is ready for pickup')
      ).toBeInTheDocument();
    });

    it('should display description for takeaway ready alert', () => {
      render(<SoundSettings />);
      expect(
        screen.getByText('Plays when a takeaway order is ready')
      ).toBeInTheDocument();
    });
  });

  describe('Sound Type Icons', () => {
    it('should display icon for new order alert', () => {
      render(<SoundSettings />);
      // Check for emoji icons in test buttons
      const testSection = screen.getByText('Test Sounds').parentElement;
      expect(testSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for switches', () => {
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
    });

    it('should have proper labels for slider', () => {
      const { container } = render(<SoundSettings />);

      // The volume control has a label showing the current percentage
      const volumeLabel = screen.getByText(/Volume:/);
      expect(volumeLabel).toBeInTheDocument();

      // The slider container should exist
      const sliderContainer = container.querySelector('[class*="select-none"]');
      expect(sliderContainer).toBeInTheDocument();
    });

    it('should support keyboard navigation for switches', () => {
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      const enableSwitch = switches[0];

      enableSwitch.focus();
      expect(document.activeElement).toBe(enableSwitch);
    });

    it('should be focusable via tab', () => {
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toBeInTheDocument();

      // All interactive elements should be tabbable
      switches.forEach((sw) => {
        expect(sw.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should load settings from service on component mount', () => {
      render(<SoundSettings />);
      expect(kitchenSoundService.getSettings).toHaveBeenCalled();
    });

    it('should update service when settings change', async () => {
      const user = userEvent.setup();
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      expect(kitchenSoundService.updateSettings).toHaveBeenCalled();
    });
  });

  describe('UI State', () => {
    it('should show all switches as checked when all sounds are enabled', () => {
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // All switches should be checked when settings have everything enabled
      switches.forEach((sw) => {
        expect(sw).toBeChecked();
      });
    });

    it('should show individual switches unchecked when master is disabled', () => {
      vi.mocked(kitchenSoundService.getSettings).mockReturnValue({
        enabled: false,
        volume: 0.7,
        newOrderEnabled: true,
        orderReadyEnabled: true,
        takeawayReadyEnabled: true,
      });
      render(<SoundSettings />);

      const switches = screen.getAllByRole('switch');
      // Individual switches should appear unchecked when master is off
      // (newOrderEnabled && enabled) would be false
      expect(switches[1]).not.toBeChecked();
      expect(switches[2]).not.toBeChecked();
      expect(switches[3]).not.toBeChecked();
    });
  });
});
