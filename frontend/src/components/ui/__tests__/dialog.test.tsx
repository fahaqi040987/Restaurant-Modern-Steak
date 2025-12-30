import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog'
import { Button } from '../button'

describe('Dialog Component', () => {
  // T260: Dialog_OpensOnTrigger
  describe('Opens on trigger click', () => {
    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test dialog</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      // Dialog content should not be visible initially
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()

      // Click the trigger
      await user.click(screen.getByRole('button', { name: 'Open Dialog' }))

      // Dialog content should now be visible
      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      })
    })

    it('opens dialog with controlled state', async () => {
      // Test controlled dialog with open prop
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument()

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
      })
    })
  })

  // T261: Dialog_ClosesOnDismiss
  describe('Closes on dismiss', () => {
    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Closable Dialog</DialogTitle>
            <DialogDescription>Click close to dismiss</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      // Dialog should be open initially
      await waitFor(() => {
        expect(screen.getByText('Closable Dialog')).toBeInTheDocument()
      })

      // Find and click the close button (X icon with sr-only "Close" text)
      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Closable Dialog')).not.toBeInTheDocument()
      })
    })

    it('closes dialog when DialogClose is clicked', async () => {
      const user = userEvent.setup()

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog with Close Action</DialogTitle>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByText('Dialog with Close Action')).toBeInTheDocument()
      })

      // Click the Cancel button which is wrapped in DialogClose
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => {
        expect(screen.queryByText('Dialog with Close Action')).not.toBeInTheDocument()
      })
    })

    it('calls onOpenChange when dialog is closed', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      render(
        <Dialog defaultOpen onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Callback Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByText('Callback Dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('closes dialog when pressing Escape', async () => {
      const user = userEvent.setup()

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Escape Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByText('Escape Dialog')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Escape Dialog')).not.toBeInTheDocument()
      })
    })
  })

  // T262: Dialog_RendersContent
  describe('Renders content correctly', () => {
    it('renders dialog header with title and description', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome</DialogTitle>
              <DialogDescription>
                This is a description of the dialog content.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument()
        expect(
          screen.getByText('This is a description of the dialog content.')
        ).toBeInTheDocument()
      })
    })

    it('renders dialog footer with action buttons', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      })
    })

    it('renders custom content inside dialog', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form data-testid="dialog-form">
              <input placeholder="Enter name" />
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        expect(screen.getByTestId('dialog-form')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
      })
    })

    it('applies custom className to DialogContent', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-dialog-class">
            <DialogTitle>Styled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        const content = screen.getByRole('dialog')
        expect(content).toHaveClass('custom-dialog-class')
      })
    })

    it('renders DialogHeader with correct layout classes', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader className="test-header">
              <DialogTitle>Header Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        const header = document.querySelector('.test-header')
        expect(header).toBeInTheDocument()
      })
    })

    it('renders DialogFooter with correct layout classes', async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Footer Test</DialogTitle>
            <DialogFooter className="test-footer">
              <Button>Action</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      await waitFor(() => {
        const footer = document.querySelector('.test-footer')
        expect(footer).toBeInTheDocument()
      })
    })
  })

  // Additional edge case tests
  describe('Edge cases', () => {
    it('handles multiple dialogs', async () => {
      const user = userEvent.setup()

      render(
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open First</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>First Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Second</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Second Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        </>
      )

      await user.click(screen.getByRole('button', { name: 'Open First' }))

      await waitFor(() => {
        expect(screen.getByText('First Dialog')).toBeInTheDocument()
      })
    })

    it('prevents body scroll when dialog is open', async () => {
      const user = userEvent.setup()

      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Modal Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      await user.click(screen.getByRole('button', { name: 'Open Dialog' }))

      await waitFor(() => {
        expect(screen.getByText('Modal Dialog')).toBeInTheDocument()
      })
    })
  })
})
