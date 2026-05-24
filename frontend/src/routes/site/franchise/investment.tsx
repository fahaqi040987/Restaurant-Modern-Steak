import { createFileRoute } from '@tanstack/react-router'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { InvestmentInfo } from '@/components/franchise/InvestmentInfo'

export const Route = createFileRoute('/site/franchise/investment')({
  component: FranchiseInvestmentPage,
})

function FranchiseInvestmentPage() {
  return (
    <FranchiseLayout>
      <InvestmentInfo />
    </FranchiseLayout>
  )
}
