import { createFileRoute } from '@tanstack/react-router'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { HeroSection } from '@/components/franchise/HeroSection'
import { VisionMission } from '@/components/franchise/VisionMission'

export const Route = createFileRoute('/site/franchise/')({
  component: FranchiseHeroPage,
})

function FranchiseHeroPage() {
  return (
    <FranchiseLayout>
      <HeroSection />
      <VisionMission />
    </FranchiseLayout>
  )
}
