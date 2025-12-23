"use client"

import * as React from "react"

interface TabsContextValue {
    value: string
    onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
    const context = React.useContext(TabsContext)
    if (!context) {
        throw new Error("Tabs components must be used within a Tabs provider")
    }
    return context
}

interface TabsProps {
    value: string
    onValueChange: (value: string) => void
    className?: string
    children: React.ReactNode
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
    ({ value, onValueChange, className = "", children, ...props }, ref) => {
        return (
            <TabsContext.Provider value={{ value, onValueChange }}>
                <div ref={ref} className={className} {...props}>
                    {children}
                </div>
            </TabsContext.Provider>
        )
    }
)
Tabs.displayName = "Tabs"

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> { }

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
    ({ className = "", ...props }, ref) => (
        <div
            ref={ref}
            className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400 ${className}`}
            {...props}
        />
    )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className = "", value, ...props }, ref) => {
        const { value: selectedValue, onValueChange } = useTabs()
        const isSelected = selectedValue === value

        return (
            <button
                ref={ref}
                type="button"
                onClick={() => onValueChange(value)}
                data-state={isSelected ? "active" : "inactive"}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isSelected
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    } ${className}`}
                {...props}
            />
        )
    }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className = "", value, ...props }, ref) => {
        const { value: selectedValue } = useTabs()

        if (selectedValue !== value) {
            return null
        }

        return (
            <div
                ref={ref}
                data-state={selectedValue === value ? "active" : "inactive"}
                className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
                {...props}
            />
        )
    }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
