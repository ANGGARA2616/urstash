"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Portals children to `document.body`. Only ever rendered client-side (gated by `open` state). */
function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

interface SlottableProps {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  ref?: React.Ref<HTMLElement>;
}

/** Clones the single child, forwarding ref + merged event handlers (no @radix-ui/react-slot dependency). */
function Slot({
  children,
  ...slotProps
}: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }) {
  if (!React.isValidElement(children)) return null;
  const child = children as unknown as React.ReactElement<SlottableProps>;

  return React.cloneElement<SlottableProps>(child, {
    ...slotProps,
    className: cn(slotProps.className, child.props.className),
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      slotProps.onClick?.(event);
    },
    ref: (node: HTMLElement | null) => {
      const childRef = child.props.ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef) (childRef as { current: HTMLElement | null }).current = node;

      const outerRef = slotProps.ref;
      if (typeof outerRef === "function") outerRef(node);
      else if (outerRef) (outerRef as { current: HTMLElement | null }).current = node;
    },
  });
}

/* ---- Root context: open state shared by the whole tree ---- */
interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);
function useDropdownMenuContext(component: string) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error(`${component} must be used within <DropdownMenu>`);
  return ctx;
}

/** Selecting an item anywhere in the tree (including inside a Sub) closes the whole menu. */
const DropdownMenuRootContext = React.createContext<{ closeAll: () => void } | null>(null);
function useDropdownMenuRoot() {
  const ctx = React.useContext(DropdownMenuRootContext);
  if (!ctx) throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  return ctx;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: openProp, defaultOpen = false, onOpenChange }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === "function" ? (value as (prev: boolean) => boolean)(open) : value;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, open],
  );

  const triggerRef = React.useRef<HTMLElement | null>(null);

  const rootValue = React.useMemo(() => ({ closeAll: () => setOpen(false) }), [setOpen]);
  const menuValue = React.useMemo(() => ({ open, setOpen, triggerRef }), [open, setOpen]);

  return (
    <DropdownMenuRootContext.Provider value={rootValue}>
      <DropdownMenuContext.Provider value={menuValue}>{children}</DropdownMenuContext.Provider>
    </DropdownMenuRootContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ asChild, className, onClick, children, ...rest }, forwardedRef) {
    const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuTrigger");

    const setRefs = (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const shared = {
      ref: setRefs,
      className: cn(className),
      "aria-haspopup": "menu" as const,
      "aria-expanded": open,
      "data-state": open ? ("open" as const) : ("closed" as const),
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        setOpen((prev) => !prev);
      },
    };

    if (asChild) return <Slot {...shared}>{children}</Slot>;

    return (
      <button type="button" {...shared} {...rest}>
        {children}
      </button>
    );
  },
);

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

/** Floating panel positioned under the trigger; closes on outside click / Escape. */
export function DropdownMenuContent({
  align = "start",
  sideOffset = 6,
  className,
  children,
  ...rest
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    let left = triggerRect.left;
    if (align === "center") left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
    if (align === "end") left = triggerRect.right - contentRect.width;
    left = Math.min(Math.max(left, 8), Math.max(window.innerWidth - contentRect.width - 8, 8));

    let top = triggerRect.bottom + sideOffset;
    if (top + contentRect.height > window.innerHeight - 8) {
      top = triggerRect.top - contentRect.height - sideOffset;
    }

    setCoords({ top, left });
  }, [align, sideOffset, triggerRef]);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  // Keep the menu glued to its trigger while scrolling — the trigger may live
  // in a sticky bar that moves relative to the document.
  React.useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={contentRef}
        role="menu"
        data-state="open"
        style={{
          position: "fixed",
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          visibility: coords ? "visible" : "hidden",
        }}
        className={cn(
          "z-50 min-w-40 rounded-panel border border-border bg-surface p-1.5 text-ink shadow-soft",
          "backdrop-blur-2xl",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  );
}

export function DropdownMenuGroup({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn(className)} {...rest} />;
}

export function DropdownMenuLabel({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-secondary", className)} {...rest} />;
}

export interface DropdownMenuItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  function DropdownMenuItem({ className, disabled, onClick, onSelect, ...rest }, ref) {
    const { closeAll } = useDropdownMenuRoot();
    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) return;
          onClick?.(event);
          onSelect?.(event.nativeEvent);
          closeAll();
        }}
        className={cn(
          "flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-fill focus:bg-fill",
          "data-disabled:pointer-events-none data-disabled:opacity-45",
          className,
        )}
        {...rest}
      />
    );
  },
);

export function DropdownMenuSeparator({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...rest} />;
}

export function DropdownMenuShortcut({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto pl-4 text-xs tracking-widest text-muted", className)} {...rest} />;
}

export const DropdownMenuPortal = Portal;

/* ---- Sub menu: nested trigger/content pair with its own open state ---- */
interface DropdownMenuSubContextValue {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  openNow: () => void;
  closeSoon: () => void;
  cancelClose: () => void;
}
const DropdownMenuSubContext = React.createContext<DropdownMenuSubContextValue | null>(null);
function useDropdownMenuSubContext(component: string) {
  const ctx = React.useContext(DropdownMenuSubContext);
  if (!ctx) throw new Error(`${component} must be used within <DropdownMenuSub>`);
  return ctx;
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  const openNow = React.useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);
  const closeSoon = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  React.useEffect(() => cancelClose, [cancelClose]);

  const value = React.useMemo(
    () => ({ open, triggerRef, openNow, closeSoon, cancelClose }),
    [open, openNow, closeSoon, cancelClose],
  );

  return <DropdownMenuSubContext.Provider value={value}>{children}</DropdownMenuSubContext.Provider>;
}

export const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DropdownMenuSubTrigger({ className, children, onClick, onMouseEnter, onMouseLeave, ...rest }, forwardedRef) {
    const { open, openNow, closeSoon, triggerRef } = useDropdownMenuSubContext("DropdownMenuSubTrigger");

    const setRefs = (node: HTMLDivElement | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      <div
        ref={setRefs}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        tabIndex={-1}
        onClick={(event) => {
          onClick?.(event);
          openNow();
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          openNow();
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          closeSoon();
        }}
        className={cn(
          "flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-fill data-[state=open]:bg-fill",
          className,
        )}
        {...rest}
      >
        {children}
        <ChevronRight size={14} className="ml-auto text-muted" />
      </div>
    );
  },
);

export function DropdownMenuSubContent({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, triggerRef, cancelClose, closeSoon } = useDropdownMenuSubContext("DropdownMenuSubContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    let left = triggerRect.right + 2;
    if (left + contentRect.width > window.innerWidth - 8) {
      left = triggerRect.left - contentRect.width - 2;
    }
    let top = triggerRect.top;
    if (top + contentRect.height > window.innerHeight - 8) {
      top = window.innerHeight - contentRect.height - 8;
    }

    setCoords({ top, left });
  }, [triggerRef]);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={contentRef}
        role="menu"
        data-state="open"
        onMouseEnter={cancelClose}
        onMouseLeave={closeSoon}
        style={{
          position: "fixed",
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          visibility: coords ? "visible" : "hidden",
        }}
        className={cn(
          "z-50 min-w-32 rounded-panel border border-border bg-surface p-1.5 text-ink shadow-soft",
          "backdrop-blur-2xl",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  );
}
