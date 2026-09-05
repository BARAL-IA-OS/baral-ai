import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}

function FieldShell({ label, htmlFor, hint, error, children }: FieldShellProps) {
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {(error || hint) && <small>{error || hint}</small>}
    </div>
  )
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function InputField({ label, hint, error, id, ...props }: InputFieldProps) {
  const fieldId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error}>
      <input id={fieldId} {...props} />
    </FieldShell>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  action?: ReactNode
}

export function TextareaField({ label, hint, error, action, id, ...props }: TextareaFieldProps) {
  const fieldId = id || props.name || label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} error={error}>
      <div className="textarea-field-wrap">
        <textarea id={fieldId} {...props} />
        {action}
      </div>
    </FieldShell>
  )
}
