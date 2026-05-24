import { createFileRoute } from '@tanstack/react-router'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseMenuSection } from '@/components/franchise/FranchiseMenuSection'

export const Route = createFileRoute('/site/franchise/menu')({
  component: FranchiseMenuPage,
})

function FranchiseMenuPage() {
  return (
    <FranchiseLayout>
      <FranchiseMenuSection />
    </FranchiseLayout>
  )
}
