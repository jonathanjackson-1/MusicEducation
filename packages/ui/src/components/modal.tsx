import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib';

type PortalContainer = Element | DocumentFragment | null;

const defaultContainer: PortalContainer =
  typeof document !== 'undefined' ? document.body : null;

export interface ModalProps {
  /** Controls whether the modal is visible. */
  isOpen: boolean;
  /** Invoked when the modal requests to be closed (overlay click, escape, etc.). */
  onClose?: () => void;
  /** Modal content. */
  children: React.ReactNode;
  /** Custom container for the portal. Defaults to document.body. */
  container?: PortalContainer;
  /** Optional class name for the overlay backdrop. */
  overlayClassName?: string;
  /** Optional class name for the modal content. */
  className?: string;
  /** Close the modal when the escape key is pressed. Defaults to true. */
  closeOnEscape?: boolean;
  /** Close the modal when the overlay is clicked. Defaults to true. */
  closeOnOverlayClick?: boolean;
  /** Accessible label for assistive technologies. */
  ariaLabel?: string;
}

const preventScroll = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  const { body } = document;
  if (!body) return;

  if (enabled) {
    body.dataset.modalLock = String((Number(body.dataset.modalLock) || 0) + 1);
    if (body.dataset.modalLock === '1') {
      body.style.overflow = 'hidden';
    }
  } else {
    const current = Number(body.dataset.modalLock) || 0;
    const next = Math.max(current - 1, 0);
    if (next === 0) {
      body.style.overflow = '';
      delete body.dataset.modalLock;
    } else {
      body.dataset.modalLock = String(next);
    }
  }
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  container = defaultContainer,
  overlayClassName,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  ariaLabel
}) => {
  const overlayRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen || !closeOnEscape || typeof document === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      preventScroll(true);
      return () => preventScroll(false);
    }

    return undefined;
  }, [isOpen]);

  const handleOverlayMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlayClick) return;

      if (event.target === overlayRef.current) {
        onClose?.();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!container || !isOpen) {
    return null;
  }

  const overlayClasses = cn(
    'fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm',
    overlayClassName
  );

  const contentClasses = cn(
    'relative w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-xl',
    className
  );

  const content = (
    <div
      ref={overlayRef}
      className={overlayClasses}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={handleOverlayMouseDown}
    >
      <div className={contentClasses}>{children}</div>
    </div>
  );

  return createPortal(content, container);
};

Modal.displayName = 'Modal';

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 border-b border-border px-6 py-4', className)} {...props} />
));
ModalHeader.displayName = 'ModalHeader';

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold leading-6', className)} {...props} />
));
ModalTitle.displayName = 'ModalTitle';

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
ModalDescription.displayName = 'ModalDescription';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
));
ModalBody.displayName = 'ModalBody';

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end', className)} {...props} />
));
ModalFooter.displayName = 'ModalFooter';

export interface ModalCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const ModalCloseButton = React.forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  ({ className, children = 'Close', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md border border-transparent bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
ModalCloseButton.displayName = 'ModalCloseButton';
