import { RecoverableErrorBoundary } from '@/components/shared/RecoverableErrorBoundary'
import { CartExperience } from '@/features/cart/CartExperience'

export default function CartPage() {
  return (
    <RecoverableErrorBoundary
      message="The Cart could not be displayed."
      title="Cart unavailable"
    >
      <CartExperience />
    </RecoverableErrorBoundary>
  )
}
