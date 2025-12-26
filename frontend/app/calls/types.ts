// ═══════════════════════════════════════════════════════════════
// SHARED TYPES FOR CALLS PAGE
// ═══════════════════════════════════════════════════════════════

export interface Lead {
    id: number;
    name: string;
    phone: string;
    city?: string;
    address?: string;
    product_interest?: string;
    source?: string;
    status: string;
    call_count: number;
    callback_date?: string;
    callback_time?: string;
    callback_notes?: string;
    notes?: string;
    trust?: string;
    trust_label?: string;
    delivered_orders?: number;
    returned_orders?: number;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    variant_name: string;
    sku: string;
    color?: string;
    size?: string;
    capacity?: string;
    image_url?: string;
    price_override?: number;
    cost_override?: number;
    stock_quantity: number;
    is_active: boolean;
    is_low_stock: boolean;
    is_in_stock: boolean;
}

export interface Product {
    id: number;
    name: string;
    selling_price: number;
    cost_price?: number;
    stock_quantity: number;
    variants?: { [key: string]: string[] };
    has_variants?: boolean;
    image_url?: string;
    product_variants?: ProductVariant[];
}

export interface OrderItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_variants?: { [key: string]: string };
}

export interface Courier {
    id: number;
    name: string;
    code: string;
    base_rate: number;
}

export interface CityData {
    name: string;
    zones: string[];
    shipping: number;
}

// ═══════════════════════════════════════════════════════════════
// MOROCCAN CITIES DATA
// ═══════════════════════════════════════════════════════════════
export const MOROCCAN_CITIES: CityData[] = [
    { name: 'Casablanca', zones: ['Maarif', 'Ain Diab', 'Sidi Bernoussi', 'Hay Hassani', 'Ain Chock', 'Anfa'], shipping: 0 },
    { name: 'Rabat', zones: ['Agdal', 'Hassan', 'Souissi', 'Hay Riad', 'Yacoub El Mansour'], shipping: 25 },
    { name: 'Salé', zones: ['Sala Al Jadida', 'Tabriquet', 'Bettana', 'Hay Salam'], shipping: 25 },
    { name: 'Marrakech', zones: ['Gueliz', 'Medina', 'Hivernage', 'Palmeraie'], shipping: 35 },
    { name: 'Fès', zones: ['Ville Nouvelle', 'Medina', 'Saiss'], shipping: 35 },
    { name: 'Tanger', zones: ['Centre Ville', 'Malabata', 'Boukhalef'], shipping: 35 },
    { name: 'Agadir', zones: ['Centre', 'Talborjt', 'Hay Mohammadi'], shipping: 40 },
    { name: 'Meknès', zones: ['Hamria', 'Ville Nouvelle'], shipping: 35 },
    { name: 'Oujda', zones: ['Centre', 'Lazaret'], shipping: 45 },
    { name: 'Kenitra', zones: ['Centre', 'Bir Rami'], shipping: 30 },
    { name: 'Tétouan', zones: ['Centre', 'Martil'], shipping: 35 },
    { name: 'Other', zones: [], shipping: 45 },
];
