import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface FieldShellProps {
  label?: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="neu-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-error"
        >
          {error}
        </motion.p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}

export interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
  leading?: ReactNode;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(function NeuInput(
  { label, error, hint, wrapperClassName, leading, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'neu-input',
            leading ? 'pl-11' : '',
            error && 'shadow-[inset_6px_6px_12px_#d8c8ce,inset_-6px_-6px_12px_#ffffff]',
            className,
          )}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export interface NeuSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  options: readonly string[] | ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  wrapperClassName?: string;
}

export const NeuSelect = forwardRef<HTMLSelectElement, NeuSelectProps>(function NeuSelect(
  { label, error, hint, options, placeholder, wrapperClassName, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const normalised = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={selectId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn('neu-input appearance-none pr-11', className)}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {normalised.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
          ▾
        </span>
      </div>
    </FieldShell>
  );
});

export interface NeuTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
}

export const NeuTextarea = forwardRef<HTMLTextAreaElement, NeuTextareaProps>(function NeuTextarea(
  { label, error, hint, wrapperClassName, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={textareaId}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={Boolean(error)}
        className={cn('neu-input min-h-[9rem] resize-y leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  );
});

export interface NeuCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export const NeuCheckbox = forwardRef<HTMLInputElement, NeuCheckboxProps>(function NeuCheckbox(
  { label, className, id, checked, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn('flex cursor-pointer select-none items-center gap-3 text-sm', className)}
    >
      <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-lg bg-neu-200 shadow-neu-inset-sm">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 cursor-pointer opacity-0"
          {...rest}
        />
        <motion.span
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className="h-3.5 w-3.5 rounded-[4px] bg-brand-gradient shadow-brand-glow"
        />
      </span>
      <span className="text-ink-600">{label}</span>
    </label>
  );
});
