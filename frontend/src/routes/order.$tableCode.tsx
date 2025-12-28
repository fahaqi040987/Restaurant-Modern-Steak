import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ShoppingCart, Plus, Minus, Check, AlertCircle, ChefHat, ArrowLeft } from 'lucide-react'
import apiClient from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { PublicMenuItem, PublicCategory } from '@/types'
import '@/styles/public-theme.css'

export const Route = createFileRoute('/order/$tableCode')({
    component: CustomerOrderPage,
})

interface CartItem {
    product: PublicMenuItem
    quantity: number
    special_instructions?: string
}

function CustomerOrderPage() {
    const { tableCode } = useParams({ from: '/order/$tableCode' })
    const navigate = useNavigate()
    const [cart, setCart] = useState<CartItem[]>([])
    const [customerName, setCustomerName] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [orderInfo, setOrderInfo] = useState<{
        order_number: string
        total_amount: number
    } | null>(null)

    // Fetch table info by QR code
    const { data: table, isLoading: tableLoading, error: tableError } = useQuery({
        queryKey: ['customer-table', tableCode],
        queryFn: () => apiClient.getTableByQRCode(tableCode),
    })

    // Fetch menu
    const { data: menuItems = [] } = useQuery({
        queryKey: ['public-menu'],
        queryFn: () => apiClient.getPublicMenu(),
        enabled: !!table,
    })

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['public-categories'],
        queryFn: () => apiClient.getPublicCategories(),
        enabled: !!table,
    })

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: () => apiClient.createCustomerOrder({
            table_id: table!.id,
            customer_name: customerName || undefined,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                special_instructions: item.special_instructions,
            })),
        }),
        onSuccess: (data) => {
            setOrderPlaced(true)
            setOrderInfo({
                order_number: data.order_number,
                total_amount: data.total_amount,
            })
            setCart([])
        },
    })

    const addToCart = (product: PublicMenuItem) => {
        const existing = cart.find(item => item.product.id === product.id)
        if (existing) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { product, quantity: 1 }])
        }
    }

    const removeFromCart = (productId: string) => {
        const existing = cart.find(item => item.product.id === productId)
        if (existing && existing.quantity > 1) {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ))
        } else {
            setCart(cart.filter(item => item.product.id !== productId))
        }
    }

    const getTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
        const tax = subtotal * 0.11
        return { subtotal, tax, total: subtotal + tax }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const filteredMenu = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category_id === selectedCategory)

    // Error state - invalid QR code
    if (tableError) {
        return (
            <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
                    <CardContent className="pt-8 text-center">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <h1 className="text-xl font-bold text-[var(--public-text-primary)] mb-2">
                            Invalid QR Code
                        </h1>
                        <p className="text-[var(--public-text-secondary)] mb-6">
                            This QR code is not recognized. Please scan a valid table QR code.
                        </p>
                        <Button
                            onClick={() => navigate({ to: '/site' })}
                            className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
                        >
                            Go to Homepage
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Loading state
    if (tableLoading) {
        return (
            <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--public-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--public-text-secondary)]">Loading menu...</p>
                </div>
            </div>
        )
    }

    // Order success state
    if (orderPlaced && orderInfo) {
        return (
            <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
                    <CardContent className="pt-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--public-text-primary)] mb-2">
                            Order Placed!
                        </h1>
                        <p className="text-[var(--public-text-secondary)] mb-4">
                            Your order is being prepared
                        </p>
                        <div className="bg-[var(--public-bg-primary)] rounded-lg p-4 mb-6">
                            <p className="text-sm text-[var(--public-text-muted)]">Order Number</p>
                            <p className="text-2xl font-bold text-[var(--public-secondary)]">
                                {orderInfo.order_number}
                            </p>
                            <p className="text-lg font-semibold text-[var(--public-text-primary)] mt-2">
                                {formatCurrency(orderInfo.total_amount)}
                            </p>
                        </div>
                        <p className="text-sm text-[var(--public-text-muted)] mb-4">
                            <ChefHat className="w-4 h-4 inline mr-1" />
                            Our kitchen is preparing your food. Please wait at Table {table?.table_number}.
                        </p>
                        <Button
                            onClick={() => {
                                setOrderPlaced(false)
                                setOrderInfo(null)
                            }}
                            className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
                        >
                            Order More
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--public-bg-primary)] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--public-bg-elevated)] border-b border-[var(--public-border)]">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-[var(--public-text-primary)]">
                                Steak<span className="text-[var(--public-secondary)]">Kenangan</span>
                            </h1>
                            <p className="text-sm text-[var(--public-text-secondary)]">
                                Table {table?.table_number}
                            </p>
                        </div>
                        {cart.length > 0 && (
                            <Badge className="bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]">
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            {/* Category Filter */}
            <div className="sticky top-[72px] z-40 bg-[var(--public-bg-primary)] border-b border-[var(--public-border)]">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Button
                            size="sm"
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory('all')}
                            className="whitespace-nowrap"
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                size="sm"
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                onClick={() => setSelectedCategory(cat.id)}
                                className="whitespace-nowrap"
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="container mx-auto px-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMenu.map(item => {
                        const cartItem = cart.find(c => c.product.id === item.id)
                        return (
                            <Card key={item.id} className="bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
                                {item.image_url && (
                                    <div className="aspect-video bg-[var(--public-bg-primary)] overflow-hidden rounded-t-lg">
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg text-[var(--public-text-primary)]">
                                                {item.name}
                                            </CardTitle>
                                            {item.description && (
                                                <p className="text-sm text-[var(--public-text-secondary)] mt-1 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-lg font-bold text-[var(--public-secondary)]">
                                            {formatCurrency(item.price)}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cartItem ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => removeFromCart(item.id)}
                                                className="h-10 w-10"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <span className="text-lg font-semibold text-[var(--public-text-primary)] w-8 text-center">
                                                {cartItem.quantity}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addToCart(item)}
                                                className="h-10 w-10"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => addToCart(item)}
                                            className="w-full bg-[var(--public-secondary)] text-[var(--public-text-on-gold)]"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add to Order
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[var(--public-bg-elevated)] border-t border-[var(--public-border)] p-4 safe-area-inset-bottom">
                    <div className="container mx-auto max-w-lg">
                        {/* Customer Name */}
                        <div className="mb-3">
                            <Input
                                placeholder="Your name (optional)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="bg-[var(--public-bg-primary)] border-[var(--public-border)] text-[var(--public-text-primary)]"
                            />
                        </div>

                        {/* Order Summary */}
                        <div className="flex justify-between items-center mb-3 text-sm">
                            <span className="text-[var(--public-text-secondary)]">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                            </span>
                            <span className="text-[var(--public-text-primary)] font-semibold">
                                Total: {formatCurrency(getTotal().total)}
                            </span>
                        </div>

                        {/* Place Order Button */}
                        <Button
                            onClick={() => createOrderMutation.mutate()}
                            disabled={createOrderMutation.isPending}
                            className="w-full h-12 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] font-semibold"
                        >
                            {createOrderMutation.isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Placing Order...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Place Order - {formatCurrency(getTotal().total)}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
