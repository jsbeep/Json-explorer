// 컴포넌트마다 동일한 값으로 반복되던 Framer Motion spring transition 프리셋
export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 400, damping: 35 };
export const SPRING_HOVER = { type: 'spring' as const, stiffness: 400, damping: 30 };
export const SPRING_SOFT = { type: 'spring' as const, stiffness: 300, damping: 28 };
export const SPRING_SHARP = { type: 'spring' as const, stiffness: 600, damping: 28 };
