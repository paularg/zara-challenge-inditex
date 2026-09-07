'use client'

import Link from 'next/link'

import { ProductImage } from '@/components/shared/ProductImage'
import { Button } from '@/components/ui/button'

import { CartAnnouncement } from './CartAnnouncement'
import {
  selectCartTotal,
  selectCartUnitCount,
  useCartStore,
  type CartLine,
} from './cartStore'

const formatPrice = (price: number) => `${price} EUR`

type CartLineItemProps = {
  line: CartLine
  onRemoveOne: (line: CartLine) => void
}

const CartLineItem = ({ line, onRemoveOne }: CartLineItemProps) => {
  const imageName = `${line.brand} ${line.name} in ${line.color}`

  return (
    <li className="group flex h-[197.863px] w-full gap-6 md:h-[324px] md:gap-10 xl:w-[548px]">
      <div className="relative h-full w-40 shrink-0 md:w-[262px]">
        <ProductImage
          alt={imageName}
          className="size-full"
          sizes="(min-width: 768px) 262px, 160px"
          src={line.imageUrl}
        />
      </div>

      <div className="group-hover:bg-primary group-hover:text-primary-foreground flex min-w-0 flex-1 flex-col justify-between py-10 text-xs leading-4 font-light">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-1 uppercase">
            <p className="truncate">{line.name}</p>
            <p className="truncate">
              {line.storage} | {line.color}
            </p>
          </div>

          <div className="flex flex-col gap-1 uppercase">
            <p>{formatPrice(line.unitPrice)}</p>
            <p>QTY: {line.quantity}</p>
          </div>
        </div>

        <button
          aria-label={`Remove one ${line.name} from Cart`}
          className="focus-outline text-destructive group-hover:text-primary-foreground min-h-6 w-fit cursor-pointer border-0 bg-transparent p-0 text-xs leading-4 font-light uppercase"
          onClick={() => onRemoveOne(line)}
          type="button"
        >
          Remove
        </button>
      </div>
    </li>
  )
}

type CartTotalProps = {
  total: number
}

const CartTotal = ({ total }: CartTotalProps) => (
  <div className="order-1 col-span-2 flex items-center justify-between gap-6 text-sm leading-4 font-normal whitespace-nowrap uppercase md:order-2 md:col-span-1 md:col-start-3">
    <span>Total</span>
    <span>{formatPrice(total)}</span>
  </div>
)

const ContinueShoppingButton = () => (
  <Button
    asChild
    className="order-2 h-12 w-full min-w-0 px-4 md:order-1 md:w-[200px] xl:h-14 xl:w-[260px]"
    size="medium"
    variant="outline"
  >
    <Link href="/">Continue shopping</Link>
  </Button>
)

const PayButton = () => (
  <Button
    className="order-3 h-12 w-full min-w-0 px-4 md:col-start-4 md:w-[260px] xl:h-14"
    size="medium"
    type="button"
  >
    Pay
  </Button>
)

const EmptyCartFooter = () => (
  <footer
    aria-label="Cart actions"
    className="bg-background mt-auto flex h-24 shrink-0 items-center px-4 py-6 md:h-28 md:px-10 md:pt-6 md:pb-10 xl:h-[136px] xl:px-[100px] xl:pt-6 xl:pb-14"
    role="group"
  >
    <ContinueShoppingButton />
  </footer>
)

const FilledCartFooter = ({ total }: CartTotalProps) => (
  <footer
    aria-label="Cart actions"
    className="bg-background mt-auto grid h-[129px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-6 px-4 pt-4 pb-6 min-[834px]:!gap-x-14 md:h-28 md:grid-cols-[200px_1fr_auto_260px] md:gap-x-8 md:gap-y-0 md:px-10 md:pt-6 md:pb-10 xl:h-[136px] xl:grid-cols-[260px_1fr_auto_260px] xl:!gap-x-20 xl:px-[100px] xl:pt-6 xl:pb-14"
    role="group"
  >
    <CartTotal total={total} />
    <ContinueShoppingButton />
    <PayButton />
  </footer>
)

const CartHydrationState = () => (
  <div aria-busy="true" className="flex min-h-[calc(100svh-80px)] flex-col">
    <section
      aria-labelledby="cart-heading"
      className="flex flex-1 flex-col gap-5 px-4 pt-6 md:gap-10 md:px-10 md:pt-12 xl:gap-16 xl:px-[100px]"
    >
      <h1
        className="m-0 text-2xl leading-[1.2] font-light uppercase"
        id="cart-heading"
      >
        Cart
      </h1>
      <p className="sr-only" role="status">
        Loading Cart.
      </p>
    </section>
  </div>
)

export const CartExperience = () => {
  const lines = useCartStore((state) => state.lines)
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const unitCount = useCartStore(selectCartUnitCount)
  const total = useCartStore(selectCartTotal)
  const decrementLine = useCartStore((state) => state.decrementLine)
  const announce = useCartStore((state) => state.announce)

  if (!hasHydrated) {
    return <CartHydrationState />
  }

  const handleRemoveOne = (line: CartLine) => {
    const remainingUnitCount = unitCount - 1

    decrementLine(line.id)
    announce(
      line.quantity > 1
        ? `Removed one ${line.name} from Cart. ${line.quantity - 1} unit${line.quantity - 1 === 1 ? '' : 's'} remains.`
        : remainingUnitCount > 0
          ? `Removed ${line.name} from Cart. ${remainingUnitCount} unit${remainingUnitCount === 1 ? '' : 's'} remain${remainingUnitCount === 1 ? 's' : ''} in Cart.`
          : `Removed ${line.name} from Cart. Cart is empty.`,
    )
  }

  return (
    <div className="flex min-h-[calc(100svh-80px)] flex-col">
      <CartAnnouncement />
      <section
        aria-labelledby="cart-heading"
        className="flex flex-1 flex-col gap-5 px-4 pt-6 md:gap-10 md:px-10 md:pt-12 xl:gap-16 xl:px-[100px]"
      >
        <h1
          className="m-0 text-2xl leading-[1.2] font-light uppercase"
          id="cart-heading"
        >
          Cart ({unitCount})
        </h1>

        {lines.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-12 p-0">
            {lines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                onRemoveOne={handleRemoveOne}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {lines.length > 0 ? (
        <FilledCartFooter total={total} />
      ) : (
        <EmptyCartFooter />
      )}
    </div>
  )
}
