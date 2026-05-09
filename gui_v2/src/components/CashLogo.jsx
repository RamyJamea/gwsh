import React from 'react';
import { Hexagon } from 'lucide-react';

export default function CashLogo({ className = '' }) {
  return (
    <div className={`cash-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, letterSpacing: '-0.02em', fontStyle: 'italic' }}>
      <Hexagon size={28} strokeWidth={2.5} />
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>Cashat</span>
    </div>
  );
}
