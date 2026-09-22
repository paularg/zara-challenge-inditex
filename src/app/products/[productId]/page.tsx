import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'

import { ProductNavigationLink } from '@/components/shared/ProductNavigationLink'
import { RecoverableErrorBoundary } from '@/components/shared/RecoverableErrorBoundary'
import { ProductScaffold } from '@/features/productDetails/ProductScaffold'
import { ProductSkeleton } from '@/features/productDetails/ProductSkeleton'
import { ProductDataError } from '@/features/products/contracts'
import { getProduct } from '@/features/products/server'

const getRouteProduct = async (
  params: PageProps<'/products/[productId]'>['params'],
) => {
  const { productId } = await params
  const product = await getProduct(productId)

  if (!product) {
    notFound()
  }

  return product
}

export const generateMetadata = async ({
  params,
}: PageProps<'/products/[productId]'>): Promise<Metadata> => {
  try {
    const product = await getRouteProduct(params)

    return {
      title: `${product.name} | MBST Smartphone Store`,
      description: product.description,
    }
  } catch (error) {
    if (!(error instanceof ProductDataError)) {
      throw error
    }

    return {
      title: 'Product unavailable | MBST Smartphone Store',
      description: 'The requested Product is temporarily unavailable.',
    }
  }
}

const ProductContent = async ({
  params,
}: Pick<PageProps<'/products/[productId]'>, 'params'>) => {
  const product = await getRouteProduct(params)

  return <ProductScaffold product={product} />
}

export default function ProductPage({
  params,
}: PageProps<'/products/[productId]'>) {
  return (
    <ViewTransition
      name="product-route"
      share="product-route-fade"
      enter="product-route-fade"
      exit="product-route-fade"
      default="none"
    >
      <section className="product-shell">
        <div className="back-row">
          <ProductNavigationLink
            className="focus-outline back-link"
            href="/"
            returnToPreviousPage
          >
            <Image
              aria-hidden="true"
              alt=""
              height={20}
              src="/assets/chevron-left.svg"
              width={20}
            />
            Back
          </ProductNavigationLink>
        </div>
        <RecoverableErrorBoundary
          message="The Product could not be displayed."
          title="Product unavailable"
        >
          <Suspense fallback={<ProductSkeleton />}>
            <ProductContent params={params} />
          </Suspense>
        </RecoverableErrorBoundary>
      </section>
    </ViewTransition>
  )
}
