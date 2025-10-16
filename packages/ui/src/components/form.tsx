import * as React from 'react';

import { cn } from '../lib';

type AriaIds = {
  descriptionId?: string;
  messageId?: string;
};

type FormFieldContextValue = {
  id: string;
  invalid?: boolean;
} & AriaIds;

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const useFormFieldContext = () => {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('Form components must be used within a <FormField>.');
  }

  return context;
};

const spacingVariants = {
  none: 'space-y-0',
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-6'
} satisfies Record<string, string>;

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Controls the vertical spacing between form fields. */
  spacing?: keyof typeof spacingVariants;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, spacing = 'md', ...props }, ref) => (
    <form ref={ref} className={cn(spacingVariants[spacing], className)} {...props} />
  )
);
Form.displayName = 'Form';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique identifier shared across label, control, and messages. */
  id: string;
  /** Optional label to display above the control. */
  label?: React.ReactNode;
  /** Optional helper description text. */
  description?: React.ReactNode;
  /** Validation message or error to show below the control. */
  message?: React.ReactNode;
  /** Marks the field as required. */
  required?: boolean;
  /**
   * When true, the control will receive `aria-invalid` and the message will be
   * exposed to assistive technologies.
   */
  invalid?: boolean;
  /** Form control element that will receive ARIA wiring. */
  control: React.ReactElement;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ id, label, description, message, required, invalid, control, className, children, ...props }, ref) => {
    const descriptionId = description ? `${id}-description` : undefined;
    const messageId = message ? `${id}-message` : undefined;

    const contextValue = React.useMemo<FormFieldContextValue>(
      () => ({ id, descriptionId, messageId, invalid }),
      [descriptionId, id, invalid, messageId]
    );

    return (
      <FormFieldContext.Provider value={contextValue}>
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {label ? (
            <FormLabel htmlFor={id} required={required}>
              {label}
            </FormLabel>
          ) : null}
          <FormControl>{control}</FormControl>
          {children}
          {description ? (
            <FormDescription id={descriptionId}>{description}</FormDescription>
          ) : null}
          {message ? (
            <FormMessage id={messageId} role={invalid ? 'alert' : undefined}>
              {message}
            </FormMessage>
          ) : null}
        </div>
      </FormFieldContext.Provider>
    );
  }
);
FormField.displayName = 'FormField';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-destructive" aria-hidden="true">*</span> : null}
    </label>
  )
);
FormLabel.displayName = 'FormLabel';

export interface FormControlProps {
  children: React.ReactElement;
}

export const FormControl = ({ children }: FormControlProps) => {
  const { id, descriptionId, messageId, invalid } = useFormFieldContext();

  const describedBy = [
    children.props['aria-describedby'],
    descriptionId,
    messageId
  ]
    .filter(Boolean)
    .join(' ');

  return React.cloneElement(children, {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': invalid ? true : undefined
  });
};

FormControl.displayName = 'FormControl';

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props} />
  )
);
FormDescription.displayName = 'FormDescription';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs font-medium text-destructive', className)} {...props} />
  )
);
FormMessage.displayName = 'FormMessage';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, description, className, children, ...props }, ref) => (
    <section ref={ref} className={cn('space-y-4 rounded-lg border border-dashed border-border p-6', className)} {...props}>
      {title ? <h3 className="text-base font-semibold leading-6 text-foreground">{title}</h3> : null}
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  )
);
FormSection.displayName = 'FormSection';
