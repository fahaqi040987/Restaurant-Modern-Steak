import { createFileRoute } from '@tanstack/react-router'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { AtmosphereGallery } from '@/components/franchise/AtmosphereGallery'

export const Route = createFileRoute('/site/franchise/atmosphere')({
  component: FranchiseAtmospherePage,
})

function FranchiseAtmospherePage() {
  return (
    <FranchiseLayout>
      <AtmosphereGallery />
    </FranchiseLayout>
  )
}
