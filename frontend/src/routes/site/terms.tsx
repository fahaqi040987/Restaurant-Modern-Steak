import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/components/public/PublicLayout'

export const Route = createFileRoute('/site/terms')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <PublicLayout>
      <div className="public-container py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <iframe
            src="/legal/terms.html"
            title="Syarat dan Ketentuan"
            className="w-full h-screen min-h-[800px] border-0"
            loading="lazy"
          />
        </div>
      </div>
    </PublicLayout>
  )
}
