import React from 'react';

interface Props {
  breadcrumb?: string[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumb, title, subtitle, actions }: Props) {
  return (
    <header className="ph-header">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={i}>
              {i === breadcrumb.length - 1 ? <strong>{crumb}</strong> : crumb}
              {i < breadcrumb.length - 1 && <span className="mx-1.5 text-ph-border-2">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="ph-header-main">
        <div>
          <h1 className="ph-header-title">{title}</h1>
          {subtitle && <p className="text-2xs text-ph-soft mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="ph-header-actions">{actions}</div>}
      </div>
    </header>
  );
}
