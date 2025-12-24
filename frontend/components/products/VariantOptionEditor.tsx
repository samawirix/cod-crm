'use client';

import { useState, useRef } from 'react';
import { X, Plus, GripVertical, Palette, Ruler, Package } from 'lucide-react';

// Common color presets with their hex codes
const COLOR_PRESETS: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#22C55E',
    'yellow': '#EAB308',
    'orange': '#F97316',
    'purple': '#A855F7',
    'pink': '#EC4899',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'gold': '#F59E0B',
    'silver': '#9CA3AF',
    'navy': '#1E3A8A',
    'brown': '#92400E',
    'beige': '#D4C4A8',
    'teal': '#14B8A6',
    'maroon': '#7F1D1D',
    'olive': '#65A30D',
    'coral': '#F97171',
};

// Common size presets
const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

interface VariantOption {
    id: string;
    type: string;
    values: string[];
}

interface Props {
    options: VariantOption[];
    onChange: (options: VariantOption[]) => void;
}

export default function VariantOptionEditor({ options, onChange }: Props) {
    const [newOptionType, setNewOptionType] = useState('');
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Generate unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Get color code from name
    const getColorCode = (name: string): string => {
        const normalized = name.toLowerCase().trim();
        return COLOR_PRESETS[normalized] || '#6B7280';
    };

    // Add new option type
    const addOptionType = (type: string) => {
        if (!type.trim()) return;

        const exists = options.some(o => o.type.toLowerCase() === type.toLowerCase());
        if (exists) {
            alert(`${type} option already exists`);
            return;
        }

        onChange([...options, { id: generateId(), type: type.trim(), values: [] }]);
        setNewOptionType('');
        setShowTypeSelector(false);
    };

    // Remove option type
    const removeOptionType = (id: string) => {
        onChange(options.filter(o => o.id !== id));
    };

    // Add value to option
    const addValue = (optionId: string, value: string) => {
        if (!value.trim()) return;

        onChange(options.map(o => {
            if (o.id !== optionId) return o;
            if (o.values.includes(value.trim())) return o;
            return { ...o, values: [...o.values, value.trim()] };
        }));
    };

    // Remove value from option
    const removeValue = (optionId: string, value: string) => {
        onChange(options.map(o => {
            if (o.id !== optionId) return o;
            return { ...o, values: o.values.filter(v => v !== value) };
        }));
    };

    // Handle key press for adding values
    const handleKeyPress = (e: React.KeyboardEvent, optionId: string, inputValue: string) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addValue(optionId, inputValue);
            if (inputRefs.current[optionId]) {
                inputRefs.current[optionId]!.value = '';
            }
        }
    };

    // Render value chip based on option type
    const renderValueChip = (option: VariantOption, value: string) => {
        const isColor = option.type.toLowerCase() === 'color' || option.type.toLowerCase() === 'colour';
        const isSize = option.type.toLowerCase() === 'size';

        if (isColor) {
            const colorCode = getColorCode(value);

            return (
                <div
                    key={value}
                    className="group flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all"
                >
                    <div
                        className="w-6 h-6 rounded-full border-2 border-gray-500 shadow-inner"
                        style={{ backgroundColor: colorCode }}
                        title={value}
                    />
                    <span className="text-sm text-white capitalize">{value}</span>
                    <button
                        type="button"
                        onClick={() => removeValue(option.id, value)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
                    >
                        <X className="w-3 h-3 text-red-400" />
                    </button>
                </div>
            );
        }

        if (isSize) {
            return (
                <div
                    key={value}
                    className="group flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 hover:border-blue-500 transition-all"
                >
                    <span className="text-sm font-medium text-white uppercase">{value}</span>
                    <button
                        type="button"
                        onClick={() => removeValue(option.id, value)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
                    >
                        <X className="w-3 h-3 text-red-400" />
                    </button>
                </div>
            );
        }

        // Default chip style
        return (
            <div
                key={value}
                className="group flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all"
            >
                <span className="text-sm text-white">{value}</span>
                <button
                    type="button"
                    onClick={() => removeValue(option.id, value)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
                >
                    <X className="w-3 h-3 text-red-400" />
                </button>
            </div>
        );
    };

    // Render preset buttons
    const renderPresets = (option: VariantOption) => {
        const isColor = option.type.toLowerCase() === 'color' || option.type.toLowerCase() === 'colour';
        const isSize = option.type.toLowerCase() === 'size';

        if (isColor) {
            const availableColors = Object.keys(COLOR_PRESETS).filter(
                c => !option.values.map(v => v.toLowerCase()).includes(c)
            );

            if (availableColors.length === 0) return null;

            return (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Quick add colors:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableColors.slice(0, 10).map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => addValue(option.id, color)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-all"
                            >
                                <div
                                    className="w-4 h-4 rounded-full border border-gray-600"
                                    style={{ backgroundColor: COLOR_PRESETS[color] }}
                                />
                                <span className="text-xs text-gray-400 capitalize">{color}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (isSize) {
            const availableSizes = SIZE_PRESETS.filter(
                s => !option.values.map(v => v.toUpperCase()).includes(s)
            );

            if (availableSizes.length === 0) return null;

            return (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Quick add sizes:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => addValue(option.id, size)}
                                className="px-3 py-1 bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 hover:border-blue-500 text-xs text-gray-400 hover:text-white transition-all"
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    // Get icon for option type
    const getOptionIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'color' || t === 'colour') return <Palette className="w-4 h-4 text-pink-400" />;
        if (t === 'size') return <Ruler className="w-4 h-4 text-blue-400" />;
        return <Package className="w-4 h-4 text-purple-400" />;
    };

    return (
        <div className="space-y-4">
            {/* Existing Options */}
            {options.map((option) => (
                <div
                    key={option.id}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
                >
                    {/* Option Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="cursor-grab text-gray-500 hover:text-gray-400">
                                <GripVertical className="w-4 h-4" />
                            </div>
                            {getOptionIcon(option.type)}
                            <span className="font-medium text-white">{option.type}</span>
                            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                                {option.values.length} values
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeOptionType(option.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Remove option"
                        >
                            <X className="w-4 h-4 text-red-400" />
                        </button>
                    </div>

                    {/* Option Values */}
                    <div className="p-4">
                        {/* Value Chips */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {option.values.map(value => renderValueChip(option, value))}

                            {/* Add Value Input */}
                            <div className="relative">
                                <input
                                    ref={el => { inputRefs.current[option.id] = el; }}
                                    type="text"
                                    placeholder="Add value..."
                                    className="w-32 px-3 py-2 bg-gray-900 border border-dashed border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                                    onKeyDown={(e) => {
                                        const input = e.target as HTMLInputElement;
                                        handleKeyPress(e, option.id, input.value);
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value.trim()) {
                                            addValue(option.id, e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Presets */}
                        {renderPresets(option)}
                    </div>
                </div>
            ))}

            {/* Add New Option Type */}
            {!showTypeSelector ? (
                <button
                    type="button"
                    onClick={() => setShowTypeSelector(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl text-gray-400 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add option (e.g., Color, Size, Material)
                </button>
            ) : (
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                    <p className="text-sm text-gray-400 mb-3">Choose an option type:</p>

                    {/* Quick Options */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {['Color', 'Size', 'Material', 'Style'].map(type => {
                            const exists = options.some(o => o.type.toLowerCase() === type.toLowerCase());
                            if (exists) return null;

                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => addOptionType(type)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-600 hover:border-blue-500 rounded-lg transition-all"
                                >
                                    {type === 'Color' && <Palette className="w-4 h-4 text-pink-400" />}
                                    {type === 'Size' && <Ruler className="w-4 h-4 text-blue-400" />}
                                    {type === 'Material' && <Package className="w-4 h-4 text-yellow-400" />}
                                    {type === 'Style' && <Package className="w-4 h-4 text-purple-400" />}
                                    <span className="text-sm text-white">{type}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Option Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newOptionType}
                            onChange={(e) => setNewOptionType(e.target.value)}
                            placeholder="Or enter custom option name..."
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addOptionType(newOptionType);
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => addOptionType(newOptionType)}
                            disabled={!newOptionType.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowTypeSelector(false);
                                setNewOptionType('');
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
