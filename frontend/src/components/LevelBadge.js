import React from 'react';

export const LEVELS = [
  { name: 'Ngưng Khí',          min: 0,      color: '#888',    bg: 'rgba(136,136,136,0.15)' },
  { name: 'Trúc Cơ',            min: 100,    color: '#4caf50', bg: 'rgba(76,175,80,0.15)' },
  { name: 'Kim Đan',            min: 300,    color: '#c8960c', bg: 'rgba(200,150,12,0.15)' },
  { name: 'Nguyên Anh',         min: 700,    color: '#4a9eff', bg: 'rgba(74,158,255,0.15)' },
  { name: 'Thiên Nhân',         min: 1500,   color: '#9c27b0', bg: 'rgba(156,39,176,0.15)' },
  { name: 'Bán Thần',           min: 3000,   color: '#ff9800', bg: 'rgba(255,152,0,0.15)' },
  { name: 'Thiên Tôn',          min: 6000,   color: '#f44336', bg: 'rgba(244,67,54,0.15)' },
  { name: 'Thái Cổ',            min: 12000,  color: '#e91e63', bg: 'rgba(233,30,99,0.15)' },
  { name: 'Chúa Tể',            min: 25000,  color: '#d32f2f', bg: 'rgba(211,47,47,0.2)' },
  { name: 'Tối Cường Chúa Tể',  min: 50000,  color: '#7c4dff', bg: 'rgba(124,77,255,0.2)' },
  { name: 'Vĩnh Hằng',          min: 100000, color: '#ffd700', bg: 'rgba(255,215,0,0.2)' },
];

export function getLevelInfo(exp = 0) {
  let info = LEVELS[0];
  for (const lvl of LEVELS) {
    if (exp >= lvl.min) info = lvl;
  }
  return info;
}

export function getNextLevel(exp = 0) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (exp < LEVELS[i].min) return LEVELS[i];
  }
  return null; // max level
}

export default function LevelBadge({ exp = 0, size = 'sm' }) {
  const info = getLevelInfo(exp);
  const fontSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;
  return (
    <span style={{
      fontSize, fontWeight: 700,
      padding: size === 'sm' ? '1px 6px' : '2px 8px',
      borderRadius: 3,
      color: info.color,
      background: info.bg,
      border: `1px solid ${info.color}`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {info.name}
    </span>
  );
}
