import { createFileRoute } from '@tanstack/react-router'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { HeroSection } from '@/components/franchise/HeroSection'

export const Route = createFileRoute('/site/franchise/')({
  component: FranchiseHeroPage,
})

function FranchiseHeroPage() {
  return (
    <FranchiseLayout>
      <HeroSection />
    </FranchiseLayout>
  )
}
